import { cache } from "react";
import type { TourListing } from "@/types";
import { mergeMarketplaceTourListings } from "@/lib/tripster/partner-tour-utils";
import { fetchCutoverPublishedTourListings } from "@/lib/tours-server-cutover";

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
    const { fetchYouTravelTourListingsServer } = await import(
      "@/lib/youtravel/partner-tour-server"
    );
    return await fetchYouTravelTourListingsServer();
  } catch {
    return [];
  }
}

/** Cached per-request marketplace catalog (platform + partner feeds in parallel). */
export const fetchMarketplaceTours = cache(async (): Promise<TourListing[]> => {
  const [platform, tripster, youtravel] = await Promise.all([
    fetchCutoverPublishedTourListings(),
    fetchPartnerTourListingsSafe(),
    fetchYouTravelTourListingsSafe(),
  ]);

  return mergeMarketplaceTourListings(platform, tripster, youtravel);
});
