import { CURRENCIES } from "@/data/locale-config";
import { convertToUsd } from "@/lib/currency";
import { resolveTourFilterPriceUsd } from "@/lib/tour-price-public";
import { isTripsterPartnerListing } from "@/lib/tripster/partner-tour-utils";
import { resolveYouTravelPartnerPriceUsd } from "@/lib/youtravel/offers-mapper";
import { isYouTravelPartnerListing } from "@/lib/youtravel/partner-tour-utils";
import type { TourListing } from "@/types";
import type { CurrencyCode } from "@/types/locale";

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

function isSupportedFilterCurrency(code: string): code is CurrencyCode {
  return CURRENCIES.some((entry) => entry.code === code);
}

function resolvePartnerListingPriceUsd(
  value: number | null | undefined,
  currency: string | null | undefined
): number | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;

  const normalized = currency?.trim().toUpperCase() || "USD";
  if (normalized === "USD") return value;
  if (isSupportedFilterCurrency(normalized)) {
    return convertToUsd(value, normalized);
  }
  return null;
}

/** USD amount for catalog price filter on Tripster listings. */
export function resolveTripsterPartnerFilterPriceUsd(tour: TourFilterPriceInput): number | null {
  const fromPartner = resolvePartnerListingPriceUsd(
    tour.partnerPriceValue,
    tour.partnerPriceCurrency
  );
  if (fromPartner != null) return fromPartner;

  return resolveTourFilterPriceUsd({
    priceUsd: tour.priceUsd,
    priceOnRequest: tour.priceOnRequest,
  });
}

/** Resolves USD price for catalog filters; null — тур не участвует в диапазоне. */
export function resolveListingFilterPriceUsd(tour: TourFilterPriceInput): number | null {
  if (isTripsterPartnerListing(tour)) {
    return resolveTripsterPartnerFilterPriceUsd(tour);
  }
  if (isYouTravelPartnerListing(tour)) {
    return resolvePartnerTourFilterPriceUsd(tour);
  }
  return resolveTourFilterPriceUsd({
    priceUsd: tour.priceUsd,
    priceOnRequest: tour.priceOnRequest,
  });
}
