import { CURRENCIES } from "@/data/locale-config";
import { convertToUsd } from "@/lib/currency";
import { parseYouTravelOfferDate } from "@/lib/youtravel/response";
import type { YouTravelOffer } from "@/lib/youtravel/types";
import type { TourDatePrice } from "@/types";
import type { CurrencyCode } from "@/types/locale";
import { formatPartnerListedPrice } from "@/lib/tripster/partner-tour-price";
import { mapYouTravelPrepaymentFields } from "@/lib/youtravel/prepayment";
import {
  resolveOfferFreeSpaces,
  resolveOfferSeatsTotal,
  resolveTravelersGoingFromOffer,
} from "@/lib/youtravel/partner-offer-occupancy";

/** RUB-scale amounts mislabeled as USD/EUR when detail currency=RUB. */
const YOUTRAVEL_MISLABELED_LOW_DENOMINATION_THRESHOLD = 10000;
const HIGH_DENOMINATION_CURRENCIES = new Set(["ARS", "CLP", "RUB"]);

/**
 * YouTravel partner offers sometimes return RUB-scale amounts with a USD/EUR label
 * when detail currency=RUB. Re-label as RUB so conversion and display stay correct.
 */
export function normalizeYouTravelPartnerPrice(
  value: number | null | undefined,
  currency: string | null | undefined
): { value: number | null; currency: string | null } {
  if (value == null || !Number.isFinite(value) || value <= 0) {
    return { value: null, currency: currency?.trim().toUpperCase() || null };
  }

  const normalizedCurrency = currency?.trim().toUpperCase() || "USD";
  if (
    !HIGH_DENOMINATION_CURRENCIES.has(normalizedCurrency) &&
    value >= YOUTRAVEL_MISLABELED_LOW_DENOMINATION_THRESHOLD
  ) {
    return { value, currency: "RUB" };
  }

  return { value, currency: normalizedCurrency };
}

function isSupportedFilterCurrency(code: string): code is CurrencyCode {
  return CURRENCIES.some((entry) => entry.code === code);
}

export function resolveYouTravelPartnerPriceUsd(
  value: number | null | undefined,
  currency: string | null | undefined
): number | null {
  const normalized = normalizeYouTravelPartnerPrice(value, currency);
  if (normalized.value == null || !normalized.currency) return null;
  if (normalized.currency === "USD") return normalized.value;
  if (isSupportedFilterCurrency(normalized.currency)) {
    return convertToUsd(normalized.value, normalized.currency);
  }
  return null;
}

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
  const rawValue = offer.priceValue ?? offer.priceFrom ?? offer.price ?? offer.minPrice;
  const resolved = resolveYouTravelPartnerPriceUsd(
    rawValue != null ? Number(rawValue) : null,
    offer.currency ?? currency
  );
  return resolved ?? fallbackUsd;
}

function resolveOfferDiscountPrice(
  currentValue: number | null | undefined,
  discountValue: number | null | undefined,
  currency: string | null | undefined,
): {
  partnerPriceValue?: number;
  partnerOriginalPriceValue?: number;
  partnerPriceCurrency?: string;
  partnerOriginalPriceCurrency?: string;
} {
  const normalizedCurrent = normalizeYouTravelPartnerPrice(
    currentValue != null ? Number(currentValue) : null,
    currency,
  );
  const current = normalizedCurrent.value;
  const currentCurrency = normalizedCurrent.currency ?? undefined;

  if (current == null || current <= 0) {
    return {};
  }

  const rawDiscount = discountValue != null ? Number(discountValue) : null;
  if (rawDiscount == null || !Number.isFinite(rawDiscount) || rawDiscount <= 0) {
    return {
      partnerPriceValue: current,
      partnerPriceCurrency: currentCurrency,
    };
  }

  const normalizedDiscount = normalizeYouTravelPartnerPrice(rawDiscount, currency);
  const discount = normalizedDiscount.value;
  if (discount == null || discount <= 0) {
    return {
      partnerPriceValue: current,
      partnerPriceCurrency: currentCurrency,
    };
  }

  if (current !== discount) {
    const sale = Math.min(current, discount);
    const original = Math.max(current, discount);
    const resolvedCurrency =
      currentCurrency ?? normalizedDiscount.currency ?? undefined;
    return {
      partnerPriceValue: sale,
      partnerOriginalPriceValue: original,
      partnerPriceCurrency: resolvedCurrency,
      partnerOriginalPriceCurrency: resolvedCurrency,
    };
  }

  return {
    partnerPriceValue: current,
    partnerPriceCurrency: currentCurrency,
  };
}

/** Tripster/YouTravel partner discounts above this ratio are treated as bad data. */
const MAX_PARTNER_DISCOUNT_RATIO = 1.5;

function isValidPartnerDiscountRatio(original: number, sale: number): boolean {
  if (original <= sale) return false;
  const ratio = original / sale;
  return ratio > 1 && ratio <= MAX_PARTNER_DISCOUNT_RATIO;
}

export type YouTravelOfferListingRow = {
  price_value?: number | null;
  price_currency?: string | null;
  payload?: YouTravelOffer | Record<string, unknown> | null;
};

function readOfferDiscountValue(
  offer: YouTravelOffer | Record<string, unknown>,
): number | null {
  const record = offer as Record<string, unknown>;
  const raw =
    record.priceDiscountValue ??
    record.price_discount_value ??
    record.priceDiscount ??
    record.price_discount;
  if (raw == null) return null;
  const parsed = typeof raw === "number" ? raw : Number.parseFloat(String(raw));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export type YouTravelListingPriceFromOffers = {
  partnerPriceValue?: number;
  partnerOriginalPriceValue?: number;
  partnerPriceCurrency?: string;
  partnerOriginalPriceCurrency?: string;
  priceUsd?: number;
  originalPriceUsd?: number;
};

/** Минимальная цена заезда для каталога, с учётом partner-скидки из офферов. */
export function resolveYouTravelListingPriceFromOffers(
  offers: YouTravelOfferListingRow[],
  fallback: {
    priceValue?: number | null;
    priceCurrency?: string | null;
    priceUsd: number;
  },
): YouTravelListingPriceFromOffers {
  let best:
    | (YouTravelListingPriceFromOffers & { sortPriceUsd: number })
    | null = null;

  for (const row of offers) {
    const payload = (row.payload ?? {}) as YouTravelOffer;
    const rawValue =
      row.price_value ??
      payload.priceValue ??
      payload.priceFrom ??
      payload.price ??
      null;
    const currency = row.price_currency ?? payload.currency ?? fallback.priceCurrency ?? null;
    const discountFields = resolveOfferDiscountPrice(
      rawValue != null ? Number(rawValue) : null,
      readOfferDiscountValue(payload),
      currency,
    );

    const saleValue = discountFields.partnerPriceValue;
    if (saleValue == null || saleValue <= 0) continue;

    const priceUsd =
      resolveYouTravelPartnerPriceUsd(saleValue, discountFields.partnerPriceCurrency ?? currency) ??
      fallback.priceUsd;

    let originalPriceUsd: number | undefined;
    let partnerOriginalPriceValue = discountFields.partnerOriginalPriceValue;

    if (
      partnerOriginalPriceValue != null &&
      isValidPartnerDiscountRatio(
        partnerOriginalPriceValue,
        saleValue,
      )
    ) {
      originalPriceUsd =
        resolveYouTravelPartnerPriceUsd(
          partnerOriginalPriceValue,
          discountFields.partnerOriginalPriceCurrency ??
            discountFields.partnerPriceCurrency ??
            currency,
        ) ?? undefined;
    } else {
      partnerOriginalPriceValue = undefined;
      originalPriceUsd = undefined;
    }

    if (!best || priceUsd < best.sortPriceUsd) {
      best = {
        sortPriceUsd: priceUsd,
        partnerPriceValue: saleValue,
        partnerOriginalPriceValue,
        partnerPriceCurrency: discountFields.partnerPriceCurrency ?? currency ?? undefined,
        partnerOriginalPriceCurrency:
          discountFields.partnerOriginalPriceCurrency ??
          discountFields.partnerPriceCurrency ??
          currency ??
          undefined,
        priceUsd,
        originalPriceUsd,
      };
    }
  }

  if (!best) return {};

  const { sortPriceUsd: _sort, ...result } = best;
  return result;
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
    const start =
      parseYouTravelOfferDate(offer.startDate ?? offer.dateFrom ?? offer.date) ?? null;
    if (!start) return;

    const end =
      parseYouTravelOfferDate(offer.endDate ?? offer.dateTo ?? offer.startDate ?? offer.dateFrom) ??
      start;
    const rawOfferValue =
      offer.priceValue ?? offer.priceFrom ?? offer.price ?? input.fallbackPriceValue ?? null;
    const rawOfferCurrency = offer.currency ?? input.fallbackCurrency ?? null;
    const rawDiscountValue =
      offer.priceDiscountValue ??
      (typeof (offer as Record<string, unknown>).price_discount_value === "number"
        ? (offer as Record<string, unknown>).price_discount_value
        : null);
    const discountFields = resolveOfferDiscountPrice(
      rawOfferValue,
      rawDiscountValue as number | null,
      rawOfferCurrency,
    );

    mapped.push({
      id: resolveOfferId(offer, input.tourId, index),
      startDate: start,
      endDate: end,
      spotsLeft: resolveOfferFreeSpaces(offer),
      seatsTotal: resolveOfferSeatsTotal(offer),
      priceUsd: resolveOfferPriceUsd(offer, input.fallbackPriceUsd, input.fallbackCurrency),
      travelersGoingCount: resolveTravelersGoingFromOffer(offer),
      ...discountFields,
      ...mapYouTravelPrepaymentFields(offer as Record<string, unknown>),
    });
  });

  return mapped.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function formatYouTravelListedPrice(
  value: number | null | undefined,
  currency: string | null | undefined
): string | undefined {
  const normalized = normalizeYouTravelPartnerPrice(value, currency);
  if (normalized.value == null || !normalized.currency) return undefined;
  return formatPartnerListedPrice(normalized.value, normalized.currency);
}
