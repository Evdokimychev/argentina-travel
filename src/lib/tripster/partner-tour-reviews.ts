import "server-only";

import {
  fetchTripsterExperienceReviews,
  fetchTripsterGuideReviews,
  isTripsterConfigured,
} from "@/lib/tripster/client";
import { fetchGuideReviewRowsServer } from "@/lib/tripster/partner-tour-guide-server";
import { mapPartnerTourReviews } from "@/lib/tripster/partner-tour-mapper";
import { tripsterReviewToRow } from "@/lib/tripster/review-mapper";
import type { TourDetail, TourReview } from "@/types";

export async function resolvePartnerTourReviews(
  tour: TourDetail,
  experienceId: number
): Promise<TourReview[]> {
  const fromDb = tour.reviews ?? [];

  if (!isTripsterConfigured()) {
    return fromDb;
  }

  try {
    const response = await fetchTripsterExperienceReviews(experienceId, 1, 50);
    const fromApi = mapPartnerTourReviews(
      (response.results ?? []).map((review, index) =>
        tripsterReviewToRow(review, review.id ?? experienceId * 1000 + index + 1)
      )
    );

    if (fromApi.length > 0) {
      return fromApi;
    }
  } catch {
    // fallback to DB
  }

  return fromDb;
}

export function syncPartnerTourReviewCount(
  tour: TourDetail,
  reviews: TourReview[]
): Pick<TourDetail, "reviews" | "reviewCount"> {
  return {
    reviews,
    reviewCount: Math.max(tour.reviewCount, reviews.length),
  };
}

export async function resolvePartnerGuideReviews(
  guideId: number,
  options?: { excludeExperienceId?: number; limit?: number }
): Promise<TourReview[]> {
  const limit = options?.limit ?? 50;

  if (isTripsterConfigured()) {
    try {
      const response = await fetchTripsterGuideReviews(guideId, 1, limit);
      const fromApi = mapPartnerTourReviews(
        (response.results ?? []).map((review, index) =>
          tripsterReviewToRow(review, review.id ?? guideId * 1000 + index + 1)
        )
      );
      if (fromApi.length > 0) return fromApi;
    } catch {
      // fallback below
    }
  }

  const rows = await fetchGuideReviewRowsServer(guideId, {
    excludeExperienceId: options?.excludeExperienceId,
    limit,
  });
  return mapPartnerTourReviews(rows);
}
