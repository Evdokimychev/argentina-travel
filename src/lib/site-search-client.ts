import { marketplaceTours } from "@/data/marketplace-tours";
import {
  buildFullSearchIndex,
  type SearchIndexItem,
} from "@/lib/site-search-index";

export function getDefaultSearchIndex(): SearchIndexItem[] {
  return buildFullSearchIndex(marketplaceTours);
}

export async function loadSearchIndex(): Promise<SearchIndexItem[]> {
  if (typeof window === "undefined") return getDefaultSearchIndex();

  try {
    const { getMarketplaceListings } = await import("@/lib/tour-repository");
    return buildFullSearchIndex(getMarketplaceListings());
  } catch {
    return getDefaultSearchIndex();
  }
}
