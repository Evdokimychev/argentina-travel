import { CURRENCIES } from "@/data/locale-config";
import { convertToUsd } from "@/lib/currency";
import { resolveTourFilterPriceUsd } from "@/lib/tour-price-public";
import { isTripsterPartnerListing } from "@/lib/tripster/partner-tour-utils";
import { isYouTravelPartnerListing } from "@/lib/youtravel/partner-tour-utils";
import type { TourListing } from "@/types";
import type { CurrencyCode } from "@/types/locale";

type TourFilterPriceInput = Pick<
  TourListing,
  "partnerSource" | "id" | "priceUsd" | "priceOnRequest" | "partnerPriceValue" | "partnerPriceCurrency"
>;

function isSupportedCurrency(code: string): code is CurrencyCode {
  return CURRENCIES.some((entry) => entry.code === code);
}

/** USD amount for catalog price filter on YouTravel listings. */
export function resolvePartnerTourFilterPriceUsd(tour: TourFilterPriceInput): number | null {
  if (!isYouTravelPartnerListing(tour)) return null;

  const value =
    tour.partnerPriceValue ?? (tour.priceUsd > 0 ? tour.priceUsd : null);
  if (value == null || !Number.isFinite(value) || value <= 0) return null;

  const currency = tour.partnerPriceCurrency?.trim().toUpperCase() ?? "USD";
  if (currency === "USD") return value;
  if (isSupportedCurrency(currency)) return convertToUsd(value, currency);
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
