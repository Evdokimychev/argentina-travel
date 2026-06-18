import { resolveExcursionPriceUsd } from "@/lib/excursion-price-display";
import { parseExcursionListingMeta } from "@/lib/excursion-listing-meta";
import { getDiscountPercent } from "@/lib/discount";
import type { PartnerTourExperienceRow } from "@/lib/tripster/partner-tour-mapper";
import type { TripsterExperience, TripsterPriceQuote } from "@/lib/tripster/types";
import type { TourDatePrice, TourDetail, TourListing } from "@/types";

export type PartnerTourPriceUnit = "per_person" | "per_group";

export type PartnerTourPriceFields = {
  value: number | null;
  currency: string | null;
  display: string | undefined;
  priceFrom: boolean;
};

export function formatPartnerListedPrice(
  value: number,
  currency: string,
  unit?: string | null
): string {
  try {
    const amount = new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
    const unitLabel = unit?.trim();
    if (!unitLabel) return amount;
    if (amount.includes(unitLabel)) return amount;
    return `${amount} ${unitLabel}`;
  } catch {
    const unitLabel = unit?.trim();
    return `${Math.round(value).toLocaleString("ru-RU")} ${currency}${unitLabel ? ` ${unitLabel}` : ""}`;
  }
}

export function resolvePartnerTourPriceFields(row: PartnerTourExperienceRow): PartnerTourPriceFields {
  const experience = row.payload as TripsterExperience | undefined;
  const price = experience?.price;
  const value =
    row.price_value != null && Number.isFinite(Number(row.price_value))
      ? Number(row.price_value)
      : price?.value != null && Number.isFinite(price.value)
        ? price.value
        : null;
  const currency = (row.price_currency ?? price?.currency ?? "").trim().toUpperCase() || null;
  const display =
    row.price_display?.trim() ||
    price?.value_string?.trim() ||
    (value != null && currency
      ? formatPartnerListedPrice(value, currency, price?.unit_string)
      : undefined);

  return {
    value,
    currency,
    display,
    priceFrom: Boolean(price?.price_from),
  };
}

export function resolvePartnerTourListedPrice(
  tour: Pick<TourDetail | TourListing, "partnerSource" | "partnerPriceDisplay">
): string | null {
  if (tour.partnerSource !== "tripster") return null;
  return tour.partnerPriceDisplay?.trim() || null;
}

export function resolvePartnerTourPriceUnit(
  experience: TripsterExperience
): PartnerTourPriceUnit {
  const isTour = experience.type?.trim().toLowerCase() === "tour";
  const price = experience.price;
  const meta = parseExcursionListingMeta(experience);

  if (isTour) {
    if (price?.per_group?.value != null && !price?.per_person?.length) {
      return "per_group";
    }
    return "per_person";
  }

  return meta.priceUnit === "per_excursion" ? "per_group" : "per_person";
}

export function parsePartnerTourDateId(
  dateId: string
): { startDate: string; time: string } | null {
  const match = dateId.match(/^tripster-(\d{4}-\d{2}-\d{2})-(\d{2}:\d{2})$/);
  if (!match) return null;
  return { startDate: match[1], time: match[2] };
}

function resolvePartnerBasePrice(
  tour: Pick<
    TourDetail | TourListing,
    "partnerPriceValue" | "partnerPriceCurrency" | "priceUsd"
  >,
  selectedDate?: TourDatePrice
): { value: number | null; currency: string } {
  const dateValue =
    selectedDate?.partnerPriceValue ??
    (selectedDate?.priceUsd != null && selectedDate.priceUsd > 0
      ? selectedDate.priceUsd
      : undefined);

  const value =
    dateValue ??
    tour.partnerPriceValue ??
    (tour.priceUsd > 0 ? tour.priceUsd : null);

  const currency =
    selectedDate?.partnerPriceCurrency?.trim().toUpperCase() ||
    tour.partnerPriceCurrency?.trim().toUpperCase() ||
    "USD";

  return { value, currency };
}

function computePartnerTotal(
  baseValue: number,
  guests: number,
  unit: PartnerTourPriceUnit
): number {
  return unit === "per_person" ? baseValue * guests : baseValue;
}

export type PartnerTourBookingPrice = {
  totalValue: number;
  originalTotalValue?: number;
  currency: string;
  showFrom: boolean;
  discountPercent?: number;
  perPersonLabel?: string;
  /** Когда Tripster отдаёт только готовую строку без числа */
  displayFallback?: string;
};

function resolveQuoteOriginalTotal(quote: TripsterPriceQuote): number | undefined {
  if (quote.per_ticket?.length) {
    const original = quote.per_ticket.reduce((sum, ticket) => {
      const count = ticket.count ?? 1;
      const price =
        ticket.price_without_tripster_discount ??
        ticket.price ??
        0;
      return sum + price * count;
    }, 0);
    if (original > 0) return original;
  }

  return undefined;
}

function resolvePartnerOriginalPerPerson(
  tour: Pick<TourDetail | TourListing, "partnerOriginalPriceValue">
): number | undefined {
  const value = tour.partnerOriginalPriceValue;
  return value != null && Number.isFinite(value) && value > 0 ? value : undefined;
}

export function formatPartnerBookingAmount(value: number, currency: string): string {
  return formatPartnerListedPrice(value, currency);
}

export function resolvePartnerTourBookingPrice(options: {
  tour: Pick<
    TourDetail | TourListing,
    | "partnerSource"
    | "partnerPriceDisplay"
    | "partnerPriceValue"
    | "partnerPriceCurrency"
    | "partnerPriceUnit"
    | "partnerOriginalPriceValue"
    | "priceFromPrefix"
    | "priceUsd"
  >;
  guests: number;
  selectedDate?: TourDatePrice;
  quote?: TripsterPriceQuote | null;
}): PartnerTourBookingPrice | null {
  if (options.tour.partnerSource !== "tripster") return null;

  const unit = options.tour.partnerPriceUnit ?? "per_person";
  const currencyFromTour =
    options.tour.partnerPriceCurrency?.trim().toUpperCase() || "USD";

  const liveQuote =
    options.selectedDate &&
    options.quote?.value != null &&
    Number.isFinite(options.quote.value) &&
    options.quote.currency
      ? options.quote
      : null;

  if (liveQuote) {
    const totalValue = liveQuote.value!;
    const currency = liveQuote.currency!.trim().toUpperCase();
    let originalTotalValue = resolveQuoteOriginalTotal(liveQuote);
    if (originalTotalValue == null) {
      const originalPerPerson = resolvePartnerOriginalPerPerson(options.tour);
      if (originalPerPerson != null) {
        originalTotalValue = computePartnerTotal(originalPerPerson, options.guests, unit);
      }
    }
    if (originalTotalValue != null && originalTotalValue <= totalValue) {
      originalTotalValue = undefined;
    }

    const discountPercent =
      originalTotalValue != null
        ? getDiscountPercent(originalTotalValue, totalValue)
        : undefined;

    const perPersonLabel =
      unit === "per_person" && options.guests > 1
        ? `${formatPartnerBookingAmount(totalValue / options.guests, currency)} за туриста`
        : undefined;

    return {
      totalValue,
      originalTotalValue,
      currency,
      showFrom: !options.selectedDate && Boolean(options.tour.priceFromPrefix),
      discountPercent,
      perPersonLabel,
    };
  }

  if (options.quote?.value_string?.trim() && !options.quote.value) {
    return {
      totalValue: 0,
      currency: currencyFromTour,
      showFrom: false,
      displayFallback: options.quote.value_string.trim(),
    };
  }

  const { value, currency } = resolvePartnerBasePrice(options.tour, options.selectedDate);
  if (value == null) {
    const display = options.tour.partnerPriceDisplay?.trim();
    if (!display) return null;
    return {
      totalValue: 0,
      currency: currencyFromTour,
      showFrom: Boolean(options.tour.priceFromPrefix),
      displayFallback: display,
    };
  }

  const totalValue = computePartnerTotal(value, options.guests, unit);
  const originalPerPerson = resolvePartnerOriginalPerPerson(options.tour);
  const originalTotalValue = originalPerPerson
    ? computePartnerTotal(originalPerPerson, options.guests, unit)
    : undefined;
  const effectiveOriginal =
    originalTotalValue != null && originalTotalValue > totalValue
      ? originalTotalValue
      : undefined;

  const discountPercent =
    effectiveOriginal != null
      ? getDiscountPercent(effectiveOriginal, totalValue)
      : undefined;

  const perPersonLabel =
    unit === "per_person" && options.guests > 1
      ? `${formatPartnerBookingAmount(value, currency)} за туриста`
      : undefined;

  return {
    totalValue,
    originalTotalValue: effectiveOriginal,
    currency,
    showFrom: Boolean(options.tour.priceFromPrefix) && !options.selectedDate,
    discountPercent,
    perPersonLabel,
  };
}

/** @deprecated Используйте resolvePartnerTourBookingPrice */
export function resolvePartnerTourBookingPriceDisplay(options: {
  tour: Parameters<typeof resolvePartnerTourBookingPrice>[0]["tour"];
  guests: number;
  selectedDate?: TourDatePrice;
  quote?: TripsterPriceQuote | null;
}): { display: string; showFrom: boolean } {
  const price = resolvePartnerTourBookingPrice(options);
  if (!price) return { display: "", showFrom: false };

  if (price.displayFallback) {
    return { display: price.displayFallback, showFrom: price.showFrom };
  }

  return {
    display: formatPartnerBookingAmount(price.totalValue, price.currency),
    showFrom: price.showFrom,
  };
}

export function resolvePartnerTourPriceUsd(row: PartnerTourExperienceRow): {
  priceUsd: number;
  priceOnRequest: boolean;
  priceFromPrefix: boolean;
} {
  const fields = resolvePartnerTourPriceFields(row);
  const usd = resolveExcursionPriceUsd({
    priceValue: fields.value ?? undefined,
    priceCurrency: fields.currency ?? undefined,
  });

  if (usd != null && usd > 0) {
    return {
      priceUsd: usd,
      priceOnRequest: false,
      priceFromPrefix: fields.priceFrom,
    };
  }

  return {
    priceUsd: 0,
    priceOnRequest: true,
    priceFromPrefix: fields.priceFrom,
  };
}
