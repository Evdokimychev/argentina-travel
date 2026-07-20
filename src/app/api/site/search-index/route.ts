import { NextResponse } from "next/server";
import { buildSiteSearchIndexServer } from "@/lib/site-search-index-server";
import { fetchSiteModules, fetchSiteNavigation } from "@/lib/site-settings-server";
import { isPublicPathIncludedInSearch } from "@/lib/public-module-visibility";

export async function GET() {
  const [items, navigation, modules] = await Promise.all([
    buildSiteSearchIndexServer(),
    fetchSiteNavigation(),
    fetchSiteModules(),
  ]);
  const clientItems = items
    .filter((item) => isPublicPathIncludedInSearch(item.href, navigation, modules))
    .map((item) => {
      const clientItem = { ...item };
      delete clientItem.searchText;
      return clientItem;
    });
  return NextResponse.json(
    clientItems,
  );
}
