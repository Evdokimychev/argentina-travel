import { NextResponse } from "next/server";
import { fetchExcursionsServer } from "@/lib/tripster/excursion-server";
import { buildExcursionSearchItems } from "@/lib/excursion-search-index";

export async function GET() {
  const { items } = await fetchExcursionsServer({ pageSize: 200 });
  return NextResponse.json(buildExcursionSearchItems(items));
}
