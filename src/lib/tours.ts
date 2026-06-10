import type { TourDetail } from "@/types";
import { getLegacySimilarTours, getLegacyTourDetail } from "@/lib/tours-legacy";
import { getRepositoryTourDetail } from "@/lib/tour-repository";

export function getTourDetail(slug: string): TourDetail | undefined {
  return getRepositoryTourDetail(slug) ?? getLegacyTourDetail(slug);
}

export function getSimilarTours(currentSlug: string, limit = 3): TourDetail[] {
  return getLegacySimilarTours(currentSlug, limit)
    .map((tour) => getTourDetail(tour.slug)!)
    .filter(Boolean)
    .slice(0, limit);
}

export async function fetchTourDetail(slug: string): Promise<TourDetail | null> {
  return getTourDetail(slug) ?? null;
}

export async function fetchSimilarTours(
  slug: string,
  limit = 3
): Promise<TourDetail[]> {
  return getSimilarTours(slug, limit);
}

export { getLegacyTourDetail } from "@/lib/tours-legacy";
