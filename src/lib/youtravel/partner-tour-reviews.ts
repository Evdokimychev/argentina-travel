import "server-only";

import { fetchYouTravelTourReviews } from "@/lib/youtravel/client";
import { isYouTravelConfigured } from "@/lib/youtravel/env";
import {
  extractYouTravelReviewsFromPayload,
  mapYouTravelReviewsToTourReviews,
} from "@/lib/youtravel/review-mapper";
import { fetchYouTravelPublicTourReviews } from "@/lib/youtravel/public-description";
import type { YouTravelTour } from "@/lib/youtravel/types";
import type { TourReview } from "@/types";

export async function resolveYouTravelTourReviews(
  tourId: number,
  payload: YouTravelTour,
): Promise<TourReview[]> {
  const fromPayload = mapYouTravelReviewsToTourReviews(extractYouTravelReviewsFromPayload(payload));
  if (fromPayload.length > 0) return fromPayload;

  if (isYouTravelConfigured()) {
    try {
      const fromApi = mapYouTravelReviewsToTourReviews(await fetchYouTravelTourReviews(tourId));
      if (fromApi.length > 0) return fromApi;
    } catch {
      // optional live fetch
    }
  }

  const serpLink =
    payload.serp && typeof payload.serp === "object" && "link" in payload.serp
      ? String((payload.serp as { link?: string }).link ?? "")
      : undefined;

  try {
    const fromPublic = mapYouTravelReviewsToTourReviews(
      await fetchYouTravelPublicTourReviews(tourId, serpLink),
    );
    if (fromPublic.length > 0) return fromPublic;
  } catch {
    // optional public fetch
  }

  return [];
}
