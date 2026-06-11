import type { TourListing } from "@/types";
import { isSupabaseToursEnabled } from "@/lib/auth-mode";

export async function fetchMarketplaceTours(): Promise<TourListing[]> {
  if (isSupabaseToursEnabled()) {
    try {
      const { fetchPublishedListingsServer } = await import("@/lib/tour-content-server");
      const fromDb = await fetchPublishedListingsServer();
      if (fromDb.length > 0) return fromDb;
    } catch {
      // fallback to local repository
    }
  }

  const { fetchRepositoryMarketplaceTours } = await import("@/lib/tour-repository");
  return fetchRepositoryMarketplaceTours();
}
