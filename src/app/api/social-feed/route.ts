import { NextResponse } from "next/server";
import { getSocialFeed } from "@/lib/social-feed/get-feed";

export const dynamic = "force-dynamic";

function parseList(value: string | null): string[] | undefined {
  if (!value) return undefined;
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const placement = searchParams.get("placement") ?? undefined;
  const sources = parseList(searchParams.get("sources"));
  const limit = Number(searchParams.get("limit") ?? "12");

  const feed = await getSocialFeed({
    placement,
    sources,
    limit: Number.isFinite(limit) ? limit : 12,
  });

  return NextResponse.json(feed, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
