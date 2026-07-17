import type { TourDetail, TourListing } from "@/types";
import { getMarketplaceListings } from "@/lib/tour-repository";
import { getTourDetail } from "@/lib/tours";
import { rankSimilarListings } from "@/lib/tour-listing-ranking";

export {
  getRecommendedListings,
  rankSimilarListings,
  scoreTourListingSimilarity,
} from "@/lib/tour-listing-ranking";

export function getSimilarTourDetails(
  currentSlug: string,
  limit = 3,
  listings: TourListing[] = getMarketplaceListings()
): TourDetail[] {
  const baseListing = listings.find((item) => item.slug === currentSlug);
  if (!baseListing) {
    return listings
      .filter((item) => item.slug !== currentSlug)
      .slice(0, limit)
      .map((item) => getTourDetail(item.slug))
      .filter((item): item is TourDetail => Boolean(item));
  }

  const ranked = rankSimilarListings(baseListing, listings, limit);
  return ranked
    .map((item) => getTourDetail(item.slug))
    .filter((item): item is TourDetail => Boolean(item));
}
