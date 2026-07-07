import { NextResponse } from "next/server";
import { buildSiteSearchIndexServer } from "@/lib/site-search-index-server";

export async function GET() {
  const items = await buildSiteSearchIndexServer();
  return NextResponse.json(items);
}
