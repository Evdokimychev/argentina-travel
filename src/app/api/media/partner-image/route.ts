import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import {
  fetchAllowedPartnerImage,
  isAllowedPartnerImageUrl,
} from "@/lib/media/partner-image-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

function boundedNumber(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

export async function GET(request: NextRequest) {
  const sourceUrl = request.nextUrl.searchParams.get("src")?.trim() ?? "";
  if (!isAllowedPartnerImageUrl(sourceUrl)) {
    return NextResponse.json({ error: "Unsupported image source" }, { status: 400 });
  }

  const width = boundedNumber(request.nextUrl.searchParams.get("w"), 1440, 160, 1800);
  const quality = boundedNumber(request.nextUrl.searchParams.get("q"), 80, 55, 90);

  try {
    const fetched = await fetchAllowedPartnerImage(sourceUrl, {
      signal: AbortSignal.timeout(12_000),
      headers: { Accept: "image/avif,image/webp,image/jpeg,image/*" },
    });
    if (!fetched.ok) {
      return NextResponse.json({ error: "Partner image unavailable" }, { status: 502 });
    }

    const { response } = fetched;
    const contentType = response.headers.get("content-type") ?? "";
    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (!contentType.startsWith("image/") || contentLength > MAX_SOURCE_BYTES) {
      return NextResponse.json({ error: "Invalid partner image" }, { status: 415 });
    }

    const source = Buffer.from(await response.arrayBuffer());
    if (source.byteLength === 0 || source.byteLength > MAX_SOURCE_BYTES) {
      return NextResponse.json({ error: "Invalid partner image size" }, { status: 415 });
    }

    const optimized = await sharp(source, { failOn: "warning" })
      .rotate()
      .resize({ width, withoutEnlargement: true, fit: "inside" })
      .webp({ quality, effort: 4 })
      .toBuffer();

    return new NextResponse(new Uint8Array(optimized), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
        "Content-Length": String(optimized.byteLength),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Partner image processing failed" }, { status: 502 });
  }
}
