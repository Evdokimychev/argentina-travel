import { NextResponse } from "next/server";
import { fetchExcursionsResultSafely } from "@/lib/tripster/excursion-server";
import { buildExcursionSearchItems } from "@/lib/excursion-search-index";

export async function GET() {
  const result = await fetchExcursionsResultSafely(
    { pageSize: 200 },
    "excursions_search_index_unavailable",
  );
  if (result.status === "unavailable") {
    return NextResponse.json([], {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  }
  return NextResponse.json(buildExcursionSearchItems(result.data.items), {
    headers: {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
    },
  });
}
