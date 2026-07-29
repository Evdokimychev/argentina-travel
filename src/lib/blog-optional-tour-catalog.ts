import type { TourListing } from "@/types";

/**
 * A commercial embed is optional editorial enrichment. Its catalog outage must
 * never reject the parent blog RSC stream or replace a valid article with the
 * segment error boundary.
 */
export async function resolveOptionalBlogTourCatalog(
  catalog: TourListing[] | Promise<TourListing[]>,
): Promise<TourListing[]> {
  try {
    return await catalog;
  } catch {
    console.error("[blog_optional_tour_catalog_unavailable]", {
      fallback: "embed_omitted",
    });
    return [];
  }
}
