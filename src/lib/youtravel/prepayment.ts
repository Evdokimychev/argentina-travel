import { formatPartnerBookingAmount } from "@/lib/tripster/partner-tour-price";
import type { TourDatePrice, TourDetail } from "@/types";

export type YouTravelPrepaymentTerms = {
  percent?: number;
  fixedValue?: number;
  fixedCurrency?: string;
};

function pickNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function resolveYouTravelPrepaymentFromOffer(
  offer: Record<string, unknown> | null | undefined,
): YouTravelPrepaymentTerms | null {
  if (!offer) return null;

  const prepayValue = pickNumber(offer.prepay_value ?? offer.prepayValue);
  if (prepayValue == null) return null;

  const unit = String(offer.prepay_value_cur ?? offer.prepayValueCur ?? "%")
    .trim()
    .toLowerCase();

  if (unit === "%" || unit === "percent" || unit === "pct") {
    return { percent: prepayValue };
  }

  const currency = String(offer.currency ?? offer.priceCurrency ?? "USD")
    .trim()
    .toUpperCase();
  return {
    fixedValue: prepayValue,
    fixedCurrency: currency || "USD",
  };
}

export function resolveYouTravelPrepaymentFromDate(
  date?: Pick<
    TourDatePrice,
    "partnerPrepayPercent" | "partnerPrepayValue" | "partnerPrepayCurrency"
  > | null,
): YouTravelPrepaymentTerms | null {
  if (!date) return null;

  if (date.partnerPrepayPercent != null && date.partnerPrepayPercent > 0) {
    return { percent: date.partnerPrepayPercent };
  }

  if (date.partnerPrepayValue != null && date.partnerPrepayValue > 0) {
    return {
      fixedValue: date.partnerPrepayValue,
      fixedCurrency: date.partnerPrepayCurrency?.trim().toUpperCase() || "USD",
    };
  }

  return null;
}

export function resolveYouTravelPrepaymentFromDates(
  dates: TourDatePrice[],
): YouTravelPrepaymentTerms | null {
  for (const date of dates) {
    const terms = resolveYouTravelPrepaymentFromDate(date);
    if (terms) return terms;
  }
  return null;
}

function resolveYouTravelBookingTotal(
  tour: Pick<TourDetail, "partnerPriceValue" | "partnerPriceCurrency" | "partnerPriceUnit">,
  selectedDate: TourDatePrice | undefined,
  guests: number,
  totalPriceUsd: number,
): { totalValue: number; currency: string } | null {
  const unitPrice = selectedDate?.partnerPriceValue ?? tour.partnerPriceValue;
  const currency =
    selectedDate?.partnerPriceCurrency?.trim().toUpperCase() ||
    tour.partnerPriceCurrency?.trim().toUpperCase() ||
    "USD";

  if (unitPrice != null && Number.isFinite(unitPrice) && unitPrice > 0 && guests > 0) {
    const unit = tour.partnerPriceUnit ?? "per_person";
    const totalValue = unit === "per_group" ? unitPrice : unitPrice * guests;
    return { totalValue, currency };
  }

  if (totalPriceUsd > 0) {
    return { totalValue: totalPriceUsd, currency: "USD" };
  }

  return null;
}

export function computeYouTravelPrepaymentAmount(
  terms: YouTravelPrepaymentTerms,
  totalValue: number,
): number | null {
  if (totalValue <= 0) return null;

  if (terms.percent != null) {
    return Math.round((totalValue * terms.percent) / 100);
  }

  if (terms.fixedValue != null) {
    return Math.round(terms.fixedValue);
  }

  return null;
}

export type YouTravelPrepaymentSummary = {
  title: string;
  description: string;
};

const YOUTRAVEL_PREPAYMENT_DESCRIPTION =
  "Для брони места в этом туре достаточно внести предоплату. Остаток можно оплатить позже.";

export function resolveYouTravelPrepaymentSummary(options: {
  tour: Pick<
    TourDetail,
    | "partnerSource"
    | "partnerPriceValue"
    | "partnerPriceCurrency"
    | "partnerPriceUnit"
    | "priceFromPrefix"
    | "dates"
  >;
  selectedDate?: TourDatePrice;
  guests: number;
  totalPriceUsd: number;
}): YouTravelPrepaymentSummary | null {
  if (options.tour.partnerSource !== "youtravel") return null;

  const terms =
    resolveYouTravelPrepaymentFromDate(options.selectedDate) ??
    resolveYouTravelPrepaymentFromDates(options.tour.dates);

  if (!terms) {
    return {
      title: "Предоплата при бронировании",
      description: YOUTRAVEL_PREPAYMENT_DESCRIPTION,
    };
  }

  const bookingTotal = resolveYouTravelBookingTotal(
    options.tour,
    options.selectedDate,
    options.guests,
    options.totalPriceUsd,
  );

  if (bookingTotal) {
    const prepayAmount = computeYouTravelPrepaymentAmount(terms, bookingTotal.totalValue);
    if (prepayAmount != null && prepayAmount > 0) {
      const currency = terms.fixedCurrency ?? bookingTotal.currency;
      const amountLabel = formatPartnerBookingAmount(prepayAmount, currency);
      const prefix =
        !options.selectedDate && options.tour.priceFromPrefix !== false ? "от " : "";
      const percentSuffix =
        terms.percent != null ? ` (${terms.percent}%)` : "";
      return {
        title: `Предоплата — ${prefix}${amountLabel}${percentSuffix}`,
        description: YOUTRAVEL_PREPAYMENT_DESCRIPTION,
      };
    }
  }

  if (terms.percent != null) {
    return {
      title: `Предоплата — ${terms.percent}% от стоимости тура`,
      description: YOUTRAVEL_PREPAYMENT_DESCRIPTION,
    };
  }

  if (terms.fixedValue != null) {
    const currency = terms.fixedCurrency ?? "USD";
    return {
      title: `Предоплата — ${formatPartnerBookingAmount(terms.fixedValue, currency)}`,
      description: YOUTRAVEL_PREPAYMENT_DESCRIPTION,
    };
  }

  return {
    title: "Предоплата при бронировании",
    description: YOUTRAVEL_PREPAYMENT_DESCRIPTION,
  };
}

export function formatYouTravelPrepaymentAdvantage(options: {
  tour: Pick<
    TourDetail,
    | "partnerSource"
    | "partnerPriceValue"
    | "partnerPriceCurrency"
    | "partnerPriceUnit"
    | "dates"
  >;
  selectedDate?: TourDatePrice;
  guests: number;
  totalPriceUsd: number;
}): string | null {
  if (options.tour.partnerSource !== "youtravel") return null;

  const terms =
    resolveYouTravelPrepaymentFromDate(options.selectedDate) ??
    resolveYouTravelPrepaymentFromDates(options.tour.dates);

  if (!terms) {
    return "Предоплата при бронировании на YouTravel.me";
  }

  const bookingTotal = resolveYouTravelBookingTotal(
    options.tour,
    options.selectedDate,
    options.guests,
    options.totalPriceUsd,
  );

  if (bookingTotal) {
    const prepayAmount = computeYouTravelPrepaymentAmount(terms, bookingTotal.totalValue);
    if (prepayAmount != null && prepayAmount > 0) {
      const currency =
        terms.fixedCurrency ??
        bookingTotal.currency;
      if (terms.percent != null) {
        return `Предоплата при бронировании: ${formatPartnerBookingAmount(prepayAmount, currency)} (${terms.percent}%)`;
      }
      return `Предоплата при бронировании: ${formatPartnerBookingAmount(prepayAmount, currency)}`;
    }
  }

  if (terms.percent != null) {
    return `Предоплата при бронировании: ${terms.percent}% от стоимости тура`;
  }

  if (terms.fixedValue != null) {
    const currency = terms.fixedCurrency ?? "USD";
    return `Предоплата при бронировании: ${formatPartnerBookingAmount(terms.fixedValue, currency)}`;
  }

  return "Предоплата при бронировании на YouTravel.me";
}

export function mapYouTravelPrepaymentFields(
  offer: YouTravelOfferLike,
): Pick<TourDatePrice, "partnerPrepayPercent" | "partnerPrepayValue" | "partnerPrepayCurrency"> {
  const terms = resolveYouTravelPrepaymentFromOffer(offer);
  if (!terms) return {};

  if (terms.percent != null) {
    return { partnerPrepayPercent: terms.percent };
  }

  return {
    partnerPrepayValue: terms.fixedValue,
    partnerPrepayCurrency: terms.fixedCurrency,
  };
}

type YouTravelOfferLike = Record<string, unknown>;
