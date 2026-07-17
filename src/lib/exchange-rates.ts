import type { CurrencyCode } from "@/types/locale";
import { CURRENCIES } from "@/data/locale-config";

const FRANKFURTER_URL = "https://api.frankfurter.app/latest?from=USD";
const REVALIDATE_SECONDS = 3600;

const TRACKED: CurrencyCode[] = [
  "RUB",
  "EUR",
  "GBP",
  "BRL",
  "CLP",
  "ARS",
  "UYU",
  "CAD",
  "AUD",
  "CHF",
];

export type ExchangeRatesPayload = {
  rates: Partial<Record<CurrencyCode, number>>;
  source: "frankfurter" | "frankfurter_partial" | "fallback";
  updatedAt: string | null;
  liveCurrencies: CurrencyCode[];
  fallbackCurrencies: CurrencyCode[];
};

function fallbackRates(): ExchangeRatesPayload {
  return {
    rates: Object.fromEntries(CURRENCIES.map((c) => [c.code, c.rateFromUsd])) as Partial<
      Record<CurrencyCode, number>
    >,
    source: "fallback",
    updatedAt: null,
    liveCurrencies: ["USD"],
    fallbackCurrencies: CURRENCIES.map((currency) => currency.code).filter(
      (code): code is CurrencyCode => code !== "USD",
    ),
  };
}

export async function fetchLiveExchangeRates(): Promise<ExchangeRatesPayload> {
  try {
    const response = await fetch(FRANKFURTER_URL, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) throw new Error(`Frankfurter HTTP ${response.status}`);

    const payload = (await response.json()) as {
      date?: string;
      rates?: Record<string, number>;
    };

    const rates: Partial<Record<CurrencyCode, number>> = { USD: 1 };
    const liveCurrencies: CurrencyCode[] = ["USD"];
    const fallbackCurrencies: CurrencyCode[] = [];

    for (const code of TRACKED) {
      const live = payload.rates?.[code];
      if (typeof live === "number" && Number.isFinite(live)) {
        rates[code] = live;
        liveCurrencies.push(code);
      } else {
        rates[code] = CURRENCIES.find((c) => c.code === code)?.rateFromUsd ?? 1;
        fallbackCurrencies.push(code);
      }
    }

    return {
      rates,
      source: fallbackCurrencies.length > 0 ? "frankfurter_partial" : "frankfurter",
      updatedAt: payload.date
        ? `${payload.date}T12:00:00.000Z`
        : null,
      liveCurrencies,
      fallbackCurrencies,
    };
  } catch {
    return fallbackRates();
  }
}

/** Payment amounts must never be calculated from approximate static display rates. */
export function requireLiveRateFromUsd(
  payload: ExchangeRatesPayload,
  currency: CurrencyCode,
): number {
  if (currency === "USD") return 1;
  if (!payload.liveCurrencies.includes(currency)) {
    throw new Error(`Live ${currency} exchange rate is unavailable.`);
  }
  const rate = payload.rates[currency];
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    throw new Error(`Live ${currency} exchange rate is invalid.`);
  }
  return rate;
}

export function resolveRateFromUsd(
  currency: CurrencyCode,
  overrides?: Partial<Record<CurrencyCode, number>>
): number {
  return overrides?.[currency] ?? CURRENCIES.find((c) => c.code === currency)?.rateFromUsd ?? 1;
}
