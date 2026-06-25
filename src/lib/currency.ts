import { CurrencyCode, LocaleCode } from "@/types/locale";
import { CURRENCIES, getCurrency } from "@/data/locale-config";

/** Upper bound for price filter slider (USD base, ~highest tour + margin) */
export const FILTER_PRICE_MAX_USD = 3000;

export function getFilterPriceMax(currency: CurrencyCode): number {
  return convertFromUsd(FILTER_PRICE_MAX_USD, currency);
}

export function getFilterPriceStep(currency: CurrencyCode): number {
  const raw = convertFromUsd(50, currency);
  if (currency === "RUB" || currency === "CLP" || currency === "ARS") {
    return Math.max(Math.round(raw / 1000) * 1000, 1000);
  }
  return Math.max(Math.round(raw / 10) * 10, 10);
}

/** Fine step for range slider — avoids Radix snap conflicts with catalog min */
export function getSliderPriceStep(
  catalogMin: number,
  priceMaxLimit: number
): number {
  const range = Math.max(priceMaxLimit - catalogMin, 1);
  if (range <= 1_000) return 1;
  if (range <= 10_000) return 10;
  if (range <= 100_000) return 100;
  return Math.max(100, Math.round(range / 200));
}

export function snapPriceToStep(
  value: number,
  origin: number,
  step: number
): number {
  if (step <= 0) return value;
  return Math.round((value - origin) / step) * step + origin;
}

export function getSliderPriceBounds(
  catalogMin: number,
  priceMaxLimit: number,
  step: number
): { min: number; max: number } {
  const max = snapPriceToStep(priceMaxLimit, catalogMin, step);
  return {
    min: catalogMin,
    max: Math.max(max, catalogMin + step),
  };
}

/** Convert USD base price to target currency */
export function convertFromUsd(priceUsd: number, currency: CurrencyCode): number {
  const rate = getCurrency(currency).rateFromUsd;
  return Math.round(priceUsd * rate);
}

/** Convert any currency amount to USD (for filters) */
export function convertToUsd(amount: number, currency: CurrencyCode): number {
  const rate = getCurrency(currency).rateFromUsd;
  return amount / rate;
}

export function formatCurrencyAmount(
  amount: number,
  currency: CurrencyCode,
  locale: LocaleCode
): string {
  const localeMap: Record<LocaleCode, string> = {
    ru: "ru-RU",
    es: "es-ES",
    en: "en-US",
    pt: "pt-BR",
  };

  try {
    return new Intl.NumberFormat(localeMap[locale], {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "CLP" || currency === "ARS" ? 0 : 0,
    }).format(amount);
  } catch {
    const sym = getCurrency(currency).symbol;
    return `${sym}${amount.toLocaleString()}`;
  }
}

const LOCALE_NUMBER: Record<LocaleCode, string> = {
  ru: "ru-RU",
  es: "es-ES",
  en: "en-US",
  pt: "pt-BR",
};

/** Plain amount for filter inputs (no currency symbol, grouped thousands). */
export function formatFilterAmount(amount: number, locale: LocaleCode): string {
  if (!Number.isFinite(amount)) return "";
  return Math.round(amount).toLocaleString(LOCALE_NUMBER[locale], {
    maximumFractionDigits: 0,
  });
}

/** Parses filter input with optional thousand separators. */
export function parseFilterAmount(raw: string): number | null {
  const normalized = raw.replace(/[\s\u00a0\u202f]/g, "").replace(/,/g, "").trim();
  if (!normalized) return null;
  const next = Number(normalized);
  return Number.isFinite(next) ? next : null;
}

export function formatPriceUsd(
  priceUsd: number,
  currency: CurrencyCode,
  locale: LocaleCode
): string {
  const converted = convertFromUsd(priceUsd, currency);
  return formatCurrencyAmount(converted, currency, locale);
}

/** Fetch live rates from API (client) or frankfurter (server). */
export async function fetchExchangeRates(): Promise<Record<CurrencyCode, number>> {
  if (typeof window !== "undefined") {
    const res = await fetch("/api/exchange-rates");
    if (res.ok) {
      const payload = (await res.json()) as { rates?: Partial<Record<CurrencyCode, number>> };
      return Object.fromEntries(
        CURRENCIES.map((c) => [c.code, payload.rates?.[c.code] ?? c.rateFromUsd])
      ) as Record<CurrencyCode, number>;
    }
  }
  return Object.fromEntries(CURRENCIES.map((c) => [c.code, c.rateFromUsd])) as Record<
    CurrencyCode,
    number
  >;
}

/** Future: detect locale from browser */
export function detectBrowserLocale(): LocaleCode {
  if (typeof navigator === "undefined") return "ru";
  const lang = navigator.language.slice(0, 2);
  if (lang === "es" || lang === "en" || lang === "pt" || lang === "ru") return lang;
  return "en";
}

/** Future: map country to default currency */
export function detectCurrencyByCountry(countryCode: string): CurrencyCode {
  const map: Record<string, CurrencyCode> = {
    RU: "RUB",
    US: "USD",
    AR: "ARS",
    BR: "BRL",
    CL: "CLP",
    UY: "UYU",
    GB: "GBP",
    CA: "CAD",
    AU: "AUD",
    CH: "CHF",
    ES: "EUR",
    DE: "EUR",
    FR: "EUR",
  };
  return map[countryCode] ?? "USD";
}
