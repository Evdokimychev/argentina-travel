import type { TourListing } from "@/types";
import { mergeMarketplaceTourListings } from "@/lib/tripster/partner-tour-utils";
import { fetchCutoverPublishedTourListings } from "@/lib/tours-server-cutover";

export async function fetchMarketplaceTours(): Promise<TourListing[]> {
  const platform = await fetchCutoverPublishedTourListings();

  try {
    const { fetchPartnerTourListingsServer } = await import("@/lib/tripster/partner-tour-server");
    const partner = await fetchPartnerTourListingsServer();
    return mergeMarketplaceTourListings(platform, partner);
  } catch {
    return platform;
  }
}
