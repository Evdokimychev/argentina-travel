import type { TourListing } from "@/types";
import { mergeMarketplaceTourListings } from "@/lib/tripster/partner-tour-utils";
import { fetchCutoverPublishedTourListings } from "@/lib/tours-server-cutover";

export async function fetchMarketplaceTours(): Promise<TourListing[]> {
  const platform = await fetchCutoverPublishedTourListings();

  let tripster: TourListing[] = [];
  let youtravel: TourListing[] = [];

  try {
    const { fetchPartnerTourListingsServer } = await import(
      "@/lib/tripster/partner-tour-server"
    );
    tripster = await fetchPartnerTourListingsServer();
  } catch {
    tripster = [];
  }

  try {
    const { fetchYouTravelTourListingsServer } = await import(
      "@/lib/youtravel/partner-tour-server"
    );
    youtravel = await fetchYouTravelTourListingsServer();
  } catch {
    youtravel = [];
  }

  return mergeMarketplaceTourListings(platform, tripster, youtravel);
}
