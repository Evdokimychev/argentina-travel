import "server-only";

import { fetchYouTravelTourOffers } from "@/lib/youtravel/client";
import { isYouTravelConfigured } from "@/lib/youtravel/env";
import { mapYouTravelOffersToTourDates } from "@/lib/youtravel/offers-mapper";
import type { TourDatePrice, TourDetail } from "@/types";

export async function fetchYouTravelLiveOffers(
  tourId: number,
  fallback: Pick<
    TourDetail,
    "priceUsd" | "partnerPriceValue" | "partnerPriceCurrency" | "dates"
  >
): Promise<TourDatePrice[]> {
  if (!isYouTravelConfigured()) return fallback.dates;

  try {
    const offers = await fetchYouTravelTourOffers(tourId);
    if (!offers.length) return fallback.dates;

    const mapped = mapYouTravelOffersToTourDates({
      tourId,
      offers,
      fallbackPriceUsd: fallback.priceUsd,
      fallbackCurrency: fallback.partnerPriceCurrency,
      fallbackPriceValue: fallback.partnerPriceValue,
    });

    return mapped.length ? mapped : fallback.dates;
  } catch {
    return fallback.dates;
  }
}

export async function enrichYouTravelTourDetailOffers(tour: TourDetail): Promise<TourDetail> {
  if (tour.partnerSource !== "youtravel" || !tour.partnerExperienceId) return tour;

  const dates = await fetchYouTravelLiveOffers(tour.partnerExperienceId, tour);
  return { ...tour, dates };
}
