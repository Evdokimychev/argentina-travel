import type { CurrencyCode, LocaleCode } from "@/types/locale";

export type IntuiConfig = {
  apiKey: string;
  partnerId: string;
  baseUrl: string;
  defaultLang: LocaleCode;
  defaultCurrency: CurrencyCode;
};

const LOCALES = new Set<LocaleCode>(["ru", "en", "es", "pt"]);
const CURRENCIES = new Set<CurrencyCode>([
  "RUB",
  "USD",
  "EUR",
  "ARS",
  "BRL",
  "CLP",
  "UYU",
  "GBP",
  "CAD",
  "AUD",
  "CHF",
]);

export function isIntuiConfigured(): boolean {
  return Boolean(process.env.INTUI_API_KEY?.trim());
}

export function getIntuiConfig(): IntuiConfig {
  const apiKey = process.env.INTUI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("INTUI_API_KEY is not configured");
  }

  const langParam = process.env.INTUI_DEFAULT_LANG?.trim() ?? "ru";
  const currencyParam = process.env.INTUI_DEFAULT_CURRENCY?.trim().toUpperCase() ?? "USD";

  return {
    apiKey,
    partnerId: process.env.INTUI_PARTNER_ID?.trim() ?? "",
    baseUrl: (process.env.INTUI_API_BASE_URL?.trim() || "https://api.intui.travel/ver1_0").replace(
      /\/$/,
      ""
    ),
    defaultLang: LOCALES.has(langParam as LocaleCode) ? (langParam as LocaleCode) : "ru",
    defaultCurrency: CURRENCIES.has(currencyParam as CurrencyCode)
      ? (currencyParam as CurrencyCode)
      : "USD",
  };
}
