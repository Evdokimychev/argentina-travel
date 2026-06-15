import type { ExcursionListing } from "@/types/excursion";
import type { TripsterPriceQuote } from "@/lib/tripster/types";
import type { CurrencyCode } from "@/types/locale";

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
  excursion: Pick<ExcursionListing, "priceCurrency" | "priceDescription" | "priceDisplay">,
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
