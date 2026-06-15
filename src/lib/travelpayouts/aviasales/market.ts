import type { CurrencyCode, LocaleCode } from "@/types/locale";
import type { AviasalesMarketConfig } from "@/lib/travelpayouts/aviasales/types";

const MARKET_BY_LOCALE: Record<LocaleCode, AviasalesMarketConfig> = {
  ru: {
    market: "ru",
    locale: "ru",
    host: "https://www.aviasales.ru",
    currency: "rub",
  },
  en: {
    market: "us",
    locale: "en",
    host: "https://www.aviasales.com",
    currency: "usd",
  },
  es: {
    market: "es",
    locale: "es",
    host: "https://www.aviasales.es",
    currency: "eur",
  },
  pt: {
    market: "br",
    locale: "pt",
    host: "https://www.aviasales.com.br",
    currency: "brl",
  },
};

export function resolveAviasalesMarket(
  locale: LocaleCode,
  currency?: CurrencyCode
): AviasalesMarketConfig {
  const base = MARKET_BY_LOCALE[locale] ?? MARKET_BY_LOCALE.en;
  if (!currency || currency === "RUB") return base;

  return {
    ...base,
    currency: currency.toLowerCase(),
  };
}
