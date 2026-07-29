import type { TourListing } from "@/types";
import { resolveTourEmbedWidgetMatches } from "@/lib/tour-embed";
import type { TourEmbedConfig } from "@/types/tour-embed";

/**
 * Detail verification is expensive and may cross several degraded providers.
 * Only verify listings that an article embed can actually render; never walk
 * the full marketplace catalog for an optional editorial widget.
 */
export function pickBlogPostTourCandidates(
  tours: TourListing[],
  embeds: TourEmbedConfig[],
): TourListing[] {
  const candidates = new Map<string, TourListing>();

  for (const embed of embeds) {
    for (const match of resolveTourEmbedWidgetMatches(tours, embed)) {
      candidates.set(match.tour.slug, match.tour);
    }
  }

  return [...candidates.values()];
}

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
