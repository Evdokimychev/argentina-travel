import { NextResponse } from "next/server";
import { executeSiteSearch } from "@/lib/search/search-query";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const kind = searchParams.get("kind") ?? undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

  const payload = await executeSiteSearch(q, {
    kind,
    limit: Number.isFinite(limit) ? limit : undefined,
  });

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
    },
  });
}
