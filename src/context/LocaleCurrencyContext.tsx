"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
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
import { getDictionary } from "@/lib/i18n/dictionaries";
import { toI18nLocale } from "@/lib/i18n/config";
import { getLocaleFromPathname } from "@/lib/i18n/locale-path";
import { formatCurrencyAmount } from "@/lib/currency";
import { resolveRateFromUsd } from "@/lib/exchange-rates";
import type { ExchangeRatesPayload } from "@/lib/exchange-rates";

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

function bootstrapMessages(locale: LocaleCode): Record<string, string> {
  return { ...getDictionary(toI18nLocale(locale)) };
}

export function LocaleCurrencyProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE);
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [messages, setMessages] = useState<Record<string, string>>(() =>
    bootstrapMessages(DEFAULT_LOCALE),
  );
  const [ready, setReady] = useState(false);
  const [liveRates, setLiveRates] = useState<Partial<Record<CurrencyCode, number>>>({});

  useEffect(() => {
    const fromPath = getLocaleFromPathname(pathname);
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as LocaleCode | null;
    const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY) as CurrencyCode | null;
    if (fromPath) {
      setLocaleState(fromPath);
    } else if (savedLocale) {
      setLocaleState(savedLocale);
    }
    if (savedCurrency) setCurrencyState(savedCurrency);
    setReady(true);
  }, []);

  useEffect(() => {
    const fromPath = getLocaleFromPathname(pathname);
    if (fromPath) {
      setLocaleState(fromPath);
      localStorage.setItem(LOCALE_STORAGE_KEY, fromPath);
    }
  }, [pathname]);

  useEffect(() => {
    fetch("/api/exchange-rates")
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: ExchangeRatesPayload | null) => {
        if (payload?.rates) setLiveRates(payload.rates);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setMessages(bootstrapMessages(locale));
    void loadMessages(locale).then(setMessages);
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
      formatPrice: (priceUsd: number) => {
        const rate = resolveRateFromUsd(currency, liveRates);
        return formatCurrencyAmount(Math.round(priceUsd * rate), currency, locale);
      },
      t: (key: string) => translate(messages, key, key),
      ready,
    }),
    [locale, currency, setLocale, setCurrency, messages, ready, liveRates]
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
