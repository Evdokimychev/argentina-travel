import type { TourReview } from "@/types";

/** Drop legacy static seed reviews — only real/platform/partner reviews remain. */
export function stripStaticSeedReviews(reviews: TourReview[]): TourReview[] {
  return reviews.filter((review) => review.source !== "static");
}

export function calculateAverageRatingFromReviews(
  reviews: Array<Pick<TourReview, "rating">>,
): number {
  if (!reviews.length) return 0;
  const sum = reviews.reduce(
    (acc, review) => acc + (Number.isFinite(review.rating) ? review.rating : 0),
    0,
  );
  return Math.round((sum / reviews.length) * 10) / 10;
}

export function deriveTourReviewStats(reviews: TourReview[]): {
  rating: number;
  reviewCount: number;
} {
  const reviewCount = reviews.length;
  return {
    reviewCount,
    rating: reviewCount > 0 ? calculateAverageRatingFromReviews(reviews) : 0,
  };
}

export function syncTourReviewFields<T extends { reviews: TourReview[]; rating: number; reviewCount: number }>(
  tour: T,
): T {
  const reviews = stripStaticSeedReviews(tour.reviews);
  const stats = deriveTourReviewStats(reviews);
  return { ...tour, reviews, ...stats };
}
