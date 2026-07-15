import { NextResponse } from "next/server";
import { buildSiteSearchIndexServer } from "@/lib/site-search-index-server";

export async function GET() {
  const items = await buildSiteSearchIndexServer();
  const clientItems = items.map((item) => {
    const clientItem = { ...item };
    delete clientItem.searchText;
    return clientItem;
  });
  return NextResponse.json(clientItems);
}
