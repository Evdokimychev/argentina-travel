import { NextResponse } from "next/server";
import { buildSiteSearchIndexServer } from "@/lib/site-search-index-server";
import { fetchSiteNavigation } from "@/lib/site-settings-server";
import { isPublicPathEnabled } from "@/lib/public-module-visibility";

export async function GET() {
  const [items, navigation] = await Promise.all([
    buildSiteSearchIndexServer(),
    fetchSiteNavigation(),
  ]);
  const clientItems = items
    .filter((item) => isPublicPathEnabled(item.href, navigation))
    .map((item) => {
      const clientItem = { ...item };
      delete clientItem.searchText;
      return clientItem;
    });
  return NextResponse.json(
    clientItems,
  );
}
