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
  source: "frankfurter" | "fallback";
  updatedAt: string;
};

function fallbackRates(): ExchangeRatesPayload {
  return {
    rates: Object.fromEntries(CURRENCIES.map((c) => [c.code, c.rateFromUsd])) as Partial<
      Record<CurrencyCode, number>
    >,
    source: "fallback",
    updatedAt: new Date().toISOString(),
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

    for (const code of TRACKED) {
      const live = payload.rates?.[code];
      if (typeof live === "number" && Number.isFinite(live)) {
        rates[code] = live;
      } else {
        rates[code] = CURRENCIES.find((c) => c.code === code)?.rateFromUsd ?? 1;
      }
    }

    return {
      rates,
      source: "frankfurter",
      updatedAt: payload.date
        ? `${payload.date}T12:00:00.000Z`
        : new Date().toISOString(),
    };
  } catch {
    return fallbackRates();
  }
}

export function resolveRateFromUsd(
  currency: CurrencyCode,
  overrides?: Partial<Record<CurrencyCode, number>>
): number {
  return overrides?.[currency] ?? CURRENCIES.find((c) => c.code === currency)?.rateFromUsd ?? 1;
}
