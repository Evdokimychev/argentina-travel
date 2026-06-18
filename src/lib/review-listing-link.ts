import type { TouristReview } from "@/types/tourist";

export function getReviewListingHref(review: TouristReview): string {
  if (review.listingKind === "excursion") {
    return `/excursions/${review.tourSlug}`;
  }
  return `/tours/${review.tourSlug}`;
}
