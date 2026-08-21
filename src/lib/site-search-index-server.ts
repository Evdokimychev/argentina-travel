import { blogPosts } from "@/data/blog";
import { DESTINATION_PAGES } from "@/data/destination-pages";
import { getAllPlaceListings } from "@/data/places-seed";
import { buildStaticSearchIndex, type SearchIndexItem } from "@/lib/site-search-index";
import { getAllEntries } from "@/lib/knowledge-base/content";
import { entryHref } from "@/lib/knowledge-base/urls";

function buildKnowledgeBaseSearchItems(): SearchIndexItem[] {
  return getAllEntries().map((entry) => ({
    id: `knowledge-${entry.id}`,
    type: "knowledge" as const,
    title: entry.title,
    description: entry.summary,
    href: entryHref(entry.id),
    keywords: [
      entry.title_es,
      ...(entry.aliases ?? []),
      ...(entry.tags ?? []),
      entry.province,
      entry.region_id,
    ].filter((value): value is string => Boolean(value)),
    searchText: entry.body,
  }));
}

function mergeSearchItems(...groups: SearchIndexItem[][]): SearchIndexItem[] {
  const byHref = new Map<string, SearchIndexItem>();
  for (const item of groups.flat()) {
    const existing = byHref.get(item.href);
    if (!existing || (item.searchText?.length ?? 0) > (existing.searchText?.length ?? 0)) {
      byHref.set(item.href, item);
    }
  }
  return [...byHref.values()];
}

export function buildOfflineStaticSearchIndex(): SearchIndexItem[] {
  return mergeSearchItems(buildStaticSearchIndex(), buildKnowledgeBaseSearchItems());
}

export async function buildStaticSearchIndexServer(): Promise<SearchIndexItem[]> {
  try {
    const [{ resolveBlogCatalog }, { resolveDestinationCatalog }, { resolvePlaceCatalog }, { resolveGuideCatalog }] =
      await Promise.all([
        import("@/lib/cms/blog-resolver"),
        import("@/lib/cms/destination-resolver"),
        import("@/lib/cms/place-resolver"),
        import("@/lib/cms/guide-resolver"),
      ]);

    const [mergedBlogCatalog, mergedDestinationCatalog, mergedPlaceCatalog, mergedGuideCatalog] =
      await Promise.all([
        resolveBlogCatalog(),
        resolveDestinationCatalog(),
        resolvePlaceCatalog(),
        resolveGuideCatalog(),
      ]);

    return mergeSearchItems(
      buildStaticSearchIndex(
        mergedBlogCatalog.length > 0 ? mergedBlogCatalog : blogPosts,
        mergedDestinationCatalog.length > 0 ? mergedDestinationCatalog : DESTINATION_PAGES,
        mergedPlaceCatalog.length > 0 ? mergedPlaceCatalog : getAllPlaceListings(),
        mergedGuideCatalog
      ),
      buildKnowledgeBaseSearchItems()
    );
  } catch {
    return buildOfflineStaticSearchIndex();
  }
}

export const buildSiteSearchIndexServer = buildStaticSearchIndexServer;
