import { getAllReviews } from "@/lib/reviews-store";
import { getOrganizerCatalogSlugs } from "@/lib/organizer-bookings";
import type { TouristReview } from "@/types/tourist";

export function getOrganizerReviewsForCabinet(userId: string): TouristReview[] {
  const slugs = new Set(getOrganizerCatalogSlugs(userId));
  return getAllReviews()
    .filter((review) => slugs.has(review.tourSlug) && review.status === "published")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getOrganizerReviewsSummary(userId: string): {
  count: number;
  averageRating: number | null;
} {
  const reviews = getOrganizerReviewsForCabinet(userId);
  if (reviews.length === 0) return { count: 0, averageRating: null };
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return {
    count: reviews.length,
    averageRating: Math.round((sum / reviews.length) * 10) / 10,
  };
}
