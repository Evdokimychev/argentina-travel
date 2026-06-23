import type { TourListing } from "@/types";
import { mergeMarketplaceTourListings } from "@/lib/tripster/partner-tour-utils";
import { fetchCutoverPublishedTourListings } from "@/lib/tours-server-cutover";

export async function fetchMarketplaceTours(): Promise<TourListing[]> {
  const platform = await fetchCutoverPublishedTourListings();

  try {
    const [{ fetchPartnerTourListingsServer }, { fetchYouTravelTourListingsServer }] =
      await Promise.all([
        import("@/lib/tripster/partner-tour-server"),
        import("@/lib/youtravel/partner-tour-server"),
      ]);

    const [tripster, youtravel] = await Promise.all([
      fetchPartnerTourListingsServer(),
      fetchYouTravelTourListingsServer(),
    ]);

    return mergeMarketplaceTourListings(platform, tripster, youtravel);
  } catch {
    return platform;
  }
}
