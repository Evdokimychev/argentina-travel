import { NextResponse } from "next/server";
import {
  publicDetailExists,
  type PublicDetailKind,
} from "@/lib/public-detail-existence";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ kind: string; slug: string }>;
};

const RESPONSE_HEADERS = {
  "Cache-Control": "public, max-age=60, s-maxage=600, stale-while-revalidate=3600",
  "X-Robots-Tag": "noindex, nofollow",
};

const PUBLIC_DETAIL_KINDS: PublicDetailKind[] = [
  "tours",
  "excursions",
  "places",
  "blog",
  "author-articles",
];

export async function HEAD(_request: Request, context: RouteContext) {
  const { kind, slug } = await context.params;
  if (!PUBLIC_DETAIL_KINDS.includes(kind as PublicDetailKind) || !slug.trim()) {
    return new NextResponse(null, { status: 400, headers: RESPONSE_HEADERS });
  }

  try {
    const exists = await publicDetailExists(kind as PublicDetailKind, slug.trim());
    return new NextResponse(null, {
      status: exists ? 204 : 404,
      headers: RESPONSE_HEADERS,
    });
  } catch {
    return new NextResponse(null, { status: 503, headers: RESPONSE_HEADERS });
  }
}
