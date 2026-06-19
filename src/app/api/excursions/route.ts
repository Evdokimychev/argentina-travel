import { NextResponse } from "next/server";
import { fetchExcursionsServer } from "@/lib/tripster/excursion-server";
import type { ExcursionListFilters } from "@/types/excursion";

function parseNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const filters: ExcursionListFilters = {
    citySlug: searchParams.get("city")?.trim() || undefined,
    query: searchParams.get("query")?.trim() || undefined,
    minPrice: parseNumber(searchParams.get("minPrice")),
    maxPrice: parseNumber(searchParams.get("maxPrice")),
    sort: (searchParams.get("sort") as ExcursionListFilters["sort"]) || undefined,
    page: parseNumber(searchParams.get("page")) ?? 1,
    pageSize: parseNumber(searchParams.get("pageSize")) ?? 24,
  };

  const result = await fetchExcursionsServer(filters);
  return NextResponse.json(result);
}
