"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CurrencyCode,
  LocaleCode,
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  CURRENCY_STORAGE_KEY,
} from "@/types/locale";
import { getLanguage, getCurrency } from "@/data/locale-config";
import { loadMessages, t as translate } from "@/lib/i18n";
import { formatPriceUsd } from "@/lib/currency";

interface LocaleCurrencyContextValue {
  locale: LocaleCode;
  currency: CurrencyCode;
  setLocale: (locale: LocaleCode) => void;
  setCurrency: (currency: CurrencyCode) => void;
  language: ReturnType<typeof getLanguage>;
  currencyInfo: ReturnType<typeof getCurrency>;
  formatPrice: (priceUsd: number) => string;
  t: (key: string) => string;
  ready: boolean;
}

const LocaleCurrencyContext = createContext<LocaleCurrencyContextValue | null>(null);

export function LocaleCurrencyProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE);
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as LocaleCode | null;
    const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY) as CurrencyCode | null;
    if (savedLocale) setLocaleState(savedLocale);
    if (savedCurrency) setCurrencyState(savedCurrency);
    setReady(true);
  }, []);

  useEffect(() => {
    loadMessages(locale).then(setMessages);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((code: LocaleCode) => {
    setLocaleState(code);
    localStorage.setItem(LOCALE_STORAGE_KEY, code);
  }, []);

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    localStorage.setItem(CURRENCY_STORAGE_KEY, code);
  }, []);

  const value = useMemo<LocaleCurrencyContextValue>(
    () => ({
      locale,
      currency,
      setLocale,
      setCurrency,
      language: getLanguage(locale),
      currencyInfo: getCurrency(currency),
      formatPrice: (priceUsd: number) => formatPriceUsd(priceUsd, currency, locale),
      t: (key: string) => translate(messages, key, key),
      ready,
    }),
    [locale, currency, setLocale, setCurrency, messages, ready]
  );

  return (
    <LocaleCurrencyContext.Provider value={value}>
      {children}
    </LocaleCurrencyContext.Provider>
  );
}

export function useLocaleCurrency() {
  const ctx = useContext(LocaleCurrencyContext);
  if (!ctx) throw new Error("useLocaleCurrency must be used within LocaleCurrencyProvider");
  return ctx;
}
