"use client";

import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { formatCurrencyAmount } from "@/lib/currency";
import { resolveRateFromUsd } from "@/lib/exchange-rates";
import type { CurrencyCode } from "@/types/locale";

interface FormattedPriceProps {
  priceUsd: number;
  className?: string;
  /** Переопределяет валюту из LocaleCurrencyContext (например, валюта checkout). */
  currency?: CurrencyCode;
  rates?: Partial<Record<CurrencyCode, number>>;
}

export default function FormattedPrice({
  priceUsd,
  className,
  currency: currencyOverride,
  rates,
}: FormattedPriceProps) {
  const { formatPrice, currency, locale } = useLocaleCurrency();
  const targetCurrency = currencyOverride ?? currency;

  if (currencyOverride) {
    const rate = resolveRateFromUsd(targetCurrency, rates);
    const formatted = formatCurrencyAmount(Math.round(priceUsd * rate), targetCurrency, locale);
    return <span className={className}>{formatted}</span>;
  }

  return <span className={className}>{formatPrice(priceUsd)}</span>;
}
