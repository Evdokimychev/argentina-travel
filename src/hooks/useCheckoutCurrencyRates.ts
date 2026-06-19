"use client";

import { useEffect, useState } from "react";
import type { ExchangeRatesPayload } from "@/lib/exchange-rates";
import type { CurrencyCode } from "@/types/locale";

export function useCheckoutCurrencyRates() {
  const [rates, setRates] = useState<Partial<Record<CurrencyCode, number>>>({});
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState<string | undefined>();
  const [ratesSource, setRatesSource] = useState<ExchangeRatesPayload["source"] | undefined>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/exchange-rates")
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: ExchangeRatesPayload | null) => {
        if (cancelled) return;
        if (payload?.rates) setRates(payload.rates);
        setRatesUpdatedAt(payload?.updatedAt);
        setRatesSource(payload?.source);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { rates, ratesUpdatedAt, ratesSource, ready };
}
