export type LocaleCode = "ru" | "es" | "en" | "pt";

export type CurrencyCode =
  | "RUB"
  | "USD"
  | "EUR"
  | "ARS"
  | "BRL"
  | "CLP"
  | "UYU"
  | "GBP"
  | "CAD"
  | "AUD"
  | "CHF";

export interface LanguageOption {
  code: LocaleCode;
  label: string;
  nativeName: string;
  flag: string;
}

export interface CurrencyOption {
  code: CurrencyCode;
  name: Record<LocaleCode, string>;
  symbol: string;
  /** Mock rate: 1 USD = rate units of this currency */
  rateFromUsd: number;
}

export interface LocaleCurrencySettings {
  locale: LocaleCode;
  currency: CurrencyCode;
}

export const LOCALE_STORAGE_KEY = "argentina-travel-locale";
export const CURRENCY_STORAGE_KEY = "argentina-travel-currency";

export const DEFAULT_LOCALE: LocaleCode = "ru";
export const DEFAULT_CURRENCY: CurrencyCode = "RUB";
