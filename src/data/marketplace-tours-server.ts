import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { TourListing } from "@/types";
import { mergeMarketplaceTourListings } from "@/lib/tripster/partner-tour-utils";

/** Каталог меняется редко; 5 мин — баланс свежести и TTFB для роботов и cold start. */
export const MARKETPLACE_CATALOG_REVALIDATE_SEC = 300;

async function loadPlatformTourListingsForCatalog(): Promise<TourListing[]> {
  const { isSupabaseToursEnabled, getToursSourceMode } = await import("@/lib/auth-mode");
  const { fetchRepositoryMarketplaceTours } = await import("@/lib/tour-repository");

  if (!isSupabaseToursEnabled()) {
    return fetchRepositoryMarketplaceTours();
  }

  try {
    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    const { fetchPublishedListings } = await import("@/lib/tour-content-server");
    const supabase = createSupabaseAdminClient();
    const fromDb = await fetchPublishedListings(supabase);
    if (fromDb.length) return fromDb;
  } catch {
    // REST/admin недоступен — seed fallback ниже
  }

  if (getToursSourceMode() === "hybrid") {
    return fetchRepositoryMarketplaceTours();
  }
  return [];
}

async function fetchPartnerTourListingsSafe(): Promise<TourListing[]> {
  try {
    const { fetchPartnerTourListingsServer } = await import(
      "@/lib/tripster/partner-tour-server"
    );
    return await fetchPartnerTourListingsServer();
  } catch {
    return [];
  }
}

async function fetchYouTravelTourListingsSafe(): Promise<TourListing[]> {
  try {
    const { fetchYouTravelTourListingsCached } = await import(
      "@/lib/youtravel/partner-tour-server"
    );
    return await fetchYouTravelTourListingsCached();
  } catch {
    return [];
  }
}

/** Без cookies/headers — безопасно для `unstable_cache`. */
async function loadMarketplaceToursUncached(): Promise<TourListing[]> {
  const [platform, tripster, youtravel] = await Promise.all([
    loadPlatformTourListingsForCatalog(),
    fetchPartnerTourListingsSafe(),
    fetchYouTravelTourListingsSafe(),
  ]);

  return mergeMarketplaceTourListings(platform, tripster, youtravel);
}

const cachedMarketplaceTours = unstable_cache(
  loadMarketplaceToursUncached,
  ["marketplace-tours-catalog-v2"],
  {
    revalidate: MARKETPLACE_CATALOG_REVALIDATE_SEC,
    tags: ["marketplace-catalog"],
  },
);

/** Cross-request catalog cache + dedupe внутри одного RSC-запроса. */
export const fetchMarketplaceTours = cache(async (): Promise<TourListing[]> => {
  return cachedMarketplaceTours();
});
