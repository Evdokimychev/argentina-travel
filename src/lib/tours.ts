import type { TourDetail } from "@/types";
import { getLegacyTourDetail } from "@/lib/tours-legacy";
import { getRepositoryTourDetail } from "@/lib/tour-repository";
import { getSimilarTourDetails } from "@/lib/tour-recommendations";

export function getTourDetail(slug: string, accessToken?: string | null): TourDetail | undefined {
  return getRepositoryTourDetail(slug, accessToken) ?? getLegacyTourDetail(slug);
}

export function getSimilarTours(currentSlug: string, limit = 3): TourDetail[] {
  return getSimilarTourDetails(currentSlug, limit);
}

export { getLegacyTourDetail } from "@/lib/tours-legacy";
