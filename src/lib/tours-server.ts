import type { TourDetail } from "@/types";
import { isSupabaseToursEnabled } from "@/lib/auth-mode";
import { getSimilarTourDetails } from "@/lib/tour-recommendations";
import { getTourDetail, getSimilarTours } from "@/lib/tours";

export async function fetchTourDetail(slug: string): Promise<TourDetail | null> {
  if (isSupabaseToursEnabled()) {
    try {
      const { fetchTourDetailBySlugServer } = await import("@/lib/tour-content-server");
      const fromDb = await fetchTourDetailBySlugServer(slug);
      if (fromDb) return fromDb;
    } catch {
      // fallback to local repository
    }
  }
  return getTourDetail(slug) ?? null;
}

export async function fetchSimilarTours(slug: string, limit = 3): Promise<TourDetail[]> {
  if (isSupabaseToursEnabled()) {
    try {
      const { fetchPublishedListingsServer } = await import("@/lib/tour-content-server");
      const listings = await fetchPublishedListingsServer();
      if (listings.length > 0) {
        return getSimilarTourDetails(slug, limit, listings);
      }
    } catch {
      // fallback
    }
  }
  return getSimilarTours(slug, limit);
}
