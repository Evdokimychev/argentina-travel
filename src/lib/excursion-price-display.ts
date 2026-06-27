import type { ExcursionListing, ExcursionTicketOption } from "@/types/excursion";
import type { TripsterPriceQuote } from "@/lib/tripster/types";
import type { CurrencyCode } from "@/types/locale";
import { computePrepaymentPercents } from "@/lib/tripster/booking-conditions";

export function stripExcursionPriceFromPrefix(label: string): string {
  return label.trim().replace(/^(от|from|desde)\s+/i, "");
}

export function excursionShowsPriceFrom(priceDisplay?: string): boolean {
  if (!priceDisplay?.trim()) return false;
  return /^(от|from|desde)\b/i.test(priceDisplay.trim());
}

export function resolveExcursionPriceUsd(excursion: Pick<ExcursionListing, "priceValue" | "priceCurrency">): number | null {
  if (excursion.priceValue == null || !Number.isFinite(excursion.priceValue)) {
    return null;
  }

  const currency = excursion.priceCurrency?.trim().toUpperCase();
  if (currency && currency !== "USD") {
    return null;
  }

  return excursion.priceValue;
}

export function resolveExcursionQuotePriceUsd(
  excursion: Pick<ExcursionListing, "priceValue" | "priceCurrency">,
  quote?: TripsterPriceQuote | null
): number | null {
  if (quote?.value != null && Number.isFinite(quote.value)) {
    const currency = quote.currency?.trim().toUpperCase();
    if (!currency || currency === "USD") return quote.value;
  }

  return resolveExcursionPriceUsd(excursion);
}

type ExcursionBookingPricing = Pick<
  ExcursionListing,
  "priceValue" | "priceCurrency" | "priceUnit"
> & {
  ticketOptions?: ExcursionTicketOption[];
};

function isUsdQuote(quote?: TripsterPriceQuote | null): quote is TripsterPriceQuote & { value: number } {
  if (quote?.value == null || !Number.isFinite(quote.value)) return false;
  const currency = quote.currency?.trim().toUpperCase();
  return !currency || currency === "USD";
}

/** Client-side total from listing tiers while Tripster quote loads or params change. */
export function estimateExcursionBookingPriceUsd(
  excursion: ExcursionBookingPricing,
  persons: number,
  slotPriceValue?: number
): number | null {
  const personsCount = Math.max(1, Math.round(persons));
  const unit = excursion.priceUnit ?? "per_person";

  if (slotPriceValue != null && Number.isFinite(slotPriceValue) && slotPriceValue > 0) {
    return unit === "per_person" ? slotPriceValue * personsCount : slotPriceValue;
  }

  const ticketOptions = excursion.ticketOptions ?? [];
  if (ticketOptions.length > 0) {
    const defaultTicket =
      ticketOptions.find((ticket) => ticket.isDefault) ?? ticketOptions[0];
    if (defaultTicket.value != null && Number.isFinite(defaultTicket.value)) {
      return defaultTicket.value * personsCount;
    }
  }

  const base = resolveExcursionPriceUsd(excursion);
  if (base == null) return null;

  return unit === "per_person" ? base * personsCount : base;
}

export function resolveExcursionBookingPriceUsd(input: {
  excursion: ExcursionBookingPricing;
  persons: number;
  quote?: TripsterPriceQuote | null;
  quoteMatchesRequest: boolean;
  slotPriceValue?: number;
}): number | null {
  if (input.quoteMatchesRequest && isUsdQuote(input.quote)) {
    return input.quote.value;
  }

  return (
    estimateExcursionBookingPriceUsd(
      input.excursion,
      input.persons,
      input.slotPriceValue
    ) ?? resolveExcursionPriceUsd(input.excursion)
  );
}

export function isExcursionBookingPriceEstimate(input: {
  hasDateAndTime: boolean;
  quoteMatchesRequest: boolean;
  quote?: TripsterPriceQuote | null;
}): boolean {
  if (!input.hasDateAndTime) return false;
  return !input.quoteMatchesRequest || !isUsdQuote(input.quote);
}

/** Tripster often repeats the same amount in price_description — skip those lines. */
export function isDuplicatePriceText(text: string | undefined, priceUsd: number | null): boolean {
  if (!text?.trim()) return true;
  if (priceUsd == null) return false;

  const normalized = text.replace(/\s+/g, " ").trim().toLowerCase();
  const digits = normalized.replace(/[^\d]/g, "");
  const amountDigits = String(Math.round(priceUsd));

  if (digits !== amountDigits) return false;

  if (normalized.length <= 48) return true;

  return /^(от\s+|from\s+)?[$€£₽]?\s*[\d\s.,]+\s*(за|per|por|for)\s+/i.test(normalized);
}

function resolvePartnerCurrency(
  excursion: Pick<ExcursionListing, "priceCurrency">,
  quote?: TripsterPriceQuote | null
): string {
  return (quote?.currency?.trim() || excursion.priceCurrency?.trim() || "USD").toUpperCase();
}

function formatPartnerAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${Math.round(amount)}`;
  }
}

/** Subtle partner price line when site currency differs from Tripster listing currency. */
export function resolvePartnerPriceFootnote(
  excursion: Pick<ExcursionListing, "priceCurrency" | "priceDisplay"> & {
    priceDescription?: string | null;
  },
  quote: TripsterPriceQuote | null | undefined,
  priceUsd: number | null,
  displayCurrency: CurrencyCode,
  t: (key: string) => string
): string | null {
  const partnerCurrency = resolvePartnerCurrency(excursion, quote);
  if (displayCurrency === partnerCurrency) return null;

  const detail = [quote?.price_description, excursion.priceDescription].find(
    (text) => text && !isDuplicatePriceText(text, priceUsd)
  );
  if (detail) return detail.trim();

  const quotedText = quote?.value_string?.trim();
  if (quotedText) {
    return t("excursions.pricePartnerOriginal").replace("{price}", quotedText);
  }

  if (priceUsd != null) {
    return t("excursions.pricePartnerOriginal").replace(
      "{price}",
      formatPartnerAmount(priceUsd, partnerCurrency)
    );
  }

  return excursion.priceDisplay?.trim() || null;
}

/** Exact price for booking preview — guests, date and time are already chosen. */
export function resolveExcursionBookingPreviewPrice(input: {
  quote?: TripsterPriceQuote | null;
  listedPriceLabel?: string | null;
  priceDisplay?: string | null;
  fallback?: string;
}): string {
  const quote = input.quote;
  if (quote?.value != null && Number.isFinite(quote.value)) {
    const currency = quote.currency?.trim().toUpperCase() || "USD";
    const stringValue = quote.value_string?.trim();
    if (stringValue && !/^(от|from|desde)\b/i.test(stringValue)) {
      return stripExcursionPriceFromPrefix(stringValue);
    }
    return formatPartnerAmount(quote.value, currency);
  }

  const raw =
    quote?.value_string?.trim() ||
    input.listedPriceLabel?.trim() ||
    input.priceDisplay?.trim() ||
    input.fallback?.trim() ||
    "Уточняется у организатора";

  return stripExcursionPriceFromPrefix(raw);
}

export function resolveExcursionBookingPreviewPrepaymentHint(
  quote: TripsterPriceQuote | null | undefined,
  t: (key: string) => string
): string | undefined {
  if (!quote) return undefined;
  const percents = computePrepaymentPercents(quote);
  if (!percents) return undefined;

  return t("excursions.bookingConditions.prepayment")
    .replace("{prepay}", String(percents.prepaymentPercent))
    .replace("{rest}", String(percents.restPercent));
}
