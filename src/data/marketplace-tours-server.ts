import type { TourListing } from "@/types";
import { isSupabaseToursEnabled } from "@/lib/auth-mode";
import { mergeMarketplaceTourListings } from "@/lib/tripster/partner-tour-utils";

export async function fetchMarketplaceTours(): Promise<TourListing[]> {
  let platform: TourListing[] = [];

  if (isSupabaseToursEnabled()) {
    try {
      const { fetchPublishedListingsServer } = await import("@/lib/tour-content-server");
      const fromDb = await fetchPublishedListingsServer();
      if (fromDb.length > 0) platform = fromDb;
    } catch {
      // fallback to local repository
    }
  }

  if (platform.length === 0) {
    const { fetchRepositoryMarketplaceTours } = await import("@/lib/tour-repository");
    platform = await fetchRepositoryMarketplaceTours();
  }

  try {
    const { fetchPartnerTourListingsServer } = await import("@/lib/tripster/partner-tour-server");
    const partner = await fetchPartnerTourListingsServer();
    return mergeMarketplaceTourListings(platform, partner);
  } catch {
    return platform;
  }
}
