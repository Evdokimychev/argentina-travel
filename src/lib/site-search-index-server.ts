import { blogPosts } from "@/data/blog";
import { DESTINATION_PAGES } from "@/data/destination-pages";
import { getAllPlaceListings } from "@/data/places-seed";
import { buildStaticSearchIndex, type SearchIndexItem } from "@/lib/site-search-index";

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

    return buildStaticSearchIndex(
      mergedBlogCatalog.length > 0 ? mergedBlogCatalog : blogPosts,
      mergedDestinationCatalog.length > 0 ? mergedDestinationCatalog : DESTINATION_PAGES,
      mergedPlaceCatalog.length > 0 ? mergedPlaceCatalog : getAllPlaceListings(),
      mergedGuideCatalog
    );
  } catch {
    return buildStaticSearchIndex();
  }
}

export const buildSiteSearchIndexServer = buildStaticSearchIndexServer;
