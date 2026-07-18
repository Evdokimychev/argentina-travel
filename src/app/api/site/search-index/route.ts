import { NextResponse } from "next/server";
import { buildSiteSearchIndexServer } from "@/lib/site-search-index-server";
import { fetchSiteNavigation } from "@/lib/site-settings-server";
import { isPublicPathEnabled } from "@/lib/public-module-visibility";

export async function GET() {
  const [items, navigation] = await Promise.all([
    buildSiteSearchIndexServer(),
    fetchSiteNavigation(),
  ]);
  return NextResponse.json(
    items.filter((item) => isPublicPathEnabled(item.href, navigation)),
  );
}
