import type { TouristReview } from "@/types/tourist";

/** Production provider: demo reviews never enter the production module graph. */
export function getDemoReviewSeeds(_now: string): TouristReview[] {
  return [];
}
