import type { YouTravelOffer } from "@/lib/youtravel/types";
import type { TourDatePrice } from "@/types";
import { formatPartnerListedPrice } from "@/lib/tripster/partner-tour-price";

function resolveOfferId(
  offer: YouTravelOffer,
  tourId: number,
  index: number
): string {
  const raw = offer.id ?? offer.externalId;
  if (raw != null) return `yt-offer-${raw}`;
  return `yt-offer-${tourId}-${index}`;
}

function resolveOfferPriceUsd(
  offer: YouTravelOffer,
  fallbackUsd: number,
  currency?: string | null
): number {
  const value = offer.priceFrom ?? offer.price ?? offer.minPrice;
  if (value == null || !Number.isFinite(Number(value))) return fallbackUsd;
  const normalizedCurrency = (offer.currency ?? currency ?? "USD").trim().toUpperCase();
  if (normalizedCurrency === "USD") return Number(value);
  return fallbackUsd;
}

export function mapYouTravelOffersToTourDates(input: {
  tourId: number;
  offers: YouTravelOffer[];
  fallbackPriceUsd: number;
  fallbackCurrency?: string | null;
  fallbackPriceValue?: number | null;
}): TourDatePrice[] {
  const mapped: TourDatePrice[] = [];

  input.offers.forEach((offer, index) => {
    const start = offer.startDate ?? offer.date;
    if (!start) return;

    const end = offer.endDate ?? start;
    const partnerPriceValue =
      offer.priceFrom ?? offer.price ?? input.fallbackPriceValue ?? undefined;
    const partnerPriceCurrency = offer.currency ?? input.fallbackCurrency ?? undefined;

    mapped.push({
      id: resolveOfferId(offer, input.tourId, index),
      startDate: String(start).slice(0, 10),
      endDate: String(end).slice(0, 10),
      spotsLeft: Math.max(
        offer.seatsAvailable ?? offer.placesLeft ?? offer.seatsTotal ?? 0,
        0
      ),
      priceUsd: resolveOfferPriceUsd(offer, input.fallbackPriceUsd, input.fallbackCurrency),
      partnerPriceValue,
      partnerPriceCurrency,
    });
  });

  return mapped.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function formatYouTravelListedPrice(
  value: number | null | undefined,
  currency: string | null | undefined
): string | undefined {
  if (value == null || !Number.isFinite(value) || !currency?.trim()) return undefined;
  return formatPartnerListedPrice(value, currency.trim().toUpperCase());
}
