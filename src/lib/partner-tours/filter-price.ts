import { resolveTourFilterPriceUsd } from "@/lib/tour-price-public";
import { isTripsterPartnerListing } from "@/lib/tripster/partner-tour-utils";
import { resolveYouTravelPartnerPriceUsd } from "@/lib/youtravel/offers-mapper";
import { isYouTravelPartnerListing } from "@/lib/youtravel/partner-tour-utils";
import type { TourListing } from "@/types";

type TourFilterPriceInput = Pick<
  TourListing,
  "partnerSource" | "id" | "priceUsd" | "priceOnRequest" | "partnerPriceValue" | "partnerPriceCurrency"
>;

/** USD amount for catalog price filter on YouTravel listings. */
export function resolvePartnerTourFilterPriceUsd(tour: TourFilterPriceInput): number | null {
  if (!isYouTravelPartnerListing(tour)) return null;

  const fromPartner = resolveYouTravelPartnerPriceUsd(
    tour.partnerPriceValue,
    tour.partnerPriceCurrency
  );
  if (fromPartner != null) return fromPartner;

  if (tour.priceUsd > 0) return tour.priceUsd;
  return null;
}

/** Resolves USD price for catalog filters; Tripster listings return null (no price filter). */
export function resolveListingFilterPriceUsd(tour: TourFilterPriceInput): number | null {
  if (isTripsterPartnerListing(tour)) return null;
  if (isYouTravelPartnerListing(tour)) {
    return resolvePartnerTourFilterPriceUsd(tour);
  }
  return resolveTourFilterPriceUsd({
    priceUsd: tour.priceUsd,
    priceOnRequest: tour.priceOnRequest,
  });
}
