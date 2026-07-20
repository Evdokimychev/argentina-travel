import { NextResponse } from "next/server";
import { buildSiteSearchIndexServer } from "@/lib/site-search-index-server";
import { fetchSiteControlPlaneEdge } from "@/lib/site-settings-edge";
import { isPublicPathIncludedInSearch } from "@/lib/public-module-visibility";

export async function GET() {
  const [items, controlPlane] = await Promise.all([
    buildSiteSearchIndexServer(),
    fetchSiteControlPlaneEdge(),
  ]);
  const clientItems = items
    .filter((item) => isPublicPathIncludedInSearch(
      item.href,
      controlPlane.navigation,
      controlPlane.modules,
    ))
    .map((item) => {
      const clientItem = { ...item };
      delete clientItem.searchText;
      return clientItem;
    });
  return NextResponse.json(
    clientItems,
  );
}
