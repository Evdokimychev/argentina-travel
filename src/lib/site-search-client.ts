import { marketplaceTours } from "@/data/marketplace-tours";
import {
  buildFullSearchIndex,
  buildStaticSearchIndex,
  buildTourSearchItems,
  type SearchIndexItem,
} from "@/lib/site-search-index";
import { buildExcursionSearchItems } from "@/lib/excursion-search-index";

function dedupeByHref(items: SearchIndexItem[]): SearchIndexItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.type}:${item.href}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getDefaultSearchIndex(): SearchIndexItem[] {
  return buildFullSearchIndex(marketplaceTours);
}

export async function loadSearchIndex(): Promise<SearchIndexItem[]> {
  if (typeof window === "undefined") return getDefaultSearchIndex();

  try {
    const [{ getMarketplaceListings }, excursionsRes, staticRes] = await Promise.all([
      import("@/lib/tour-repository"),
      fetch("/api/excursions/search-index").catch(() => null),
      fetch("/api/site/search-index").catch(() => null),
    ]);

    const excursionItems =
      excursionsRes?.ok ? ((await excursionsRes.json()) as SearchIndexItem[]) : [];
    const staticItems = staticRes?.ok
      ? ((await staticRes.json()) as SearchIndexItem[])
      : buildStaticSearchIndex();

    return dedupeByHref([
      ...buildTourSearchItems(getMarketplaceListings()),
      ...excursionItems,
      ...staticItems,
    ]);
  } catch {
    return getDefaultSearchIndex();
  }
}
