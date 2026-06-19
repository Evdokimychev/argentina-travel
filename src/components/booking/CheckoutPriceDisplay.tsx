"use client";

import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { cn } from "@/lib/cn";
import {
  CHECKOUT_RATE_DISCLAIMER_RU,
  formatChargeCurrencyLabel,
  formatCheckoutAmount,
  type CheckoutCurrencyCode,
} from "@/lib/payments/checkout-currency";
import type { PaymentProviderId } from "@/types/payment-webhook";
import type { CurrencyCode } from "@/types/locale";

interface CheckoutPriceDisplayProps {
  amountUsd: number;
  currency: CheckoutCurrencyCode;
  rates?: Partial<Record<CurrencyCode, number>>;
  className?: string;
  amountClassName?: string;
  showDisclaimer?: boolean;
  provider?: PaymentProviderId;
  secondaryAmountUsd?: number;
  secondaryLabel?: string;
}

export default function CheckoutPriceDisplay({
  amountUsd,
  currency,
  rates,
  className,
  amountClassName,
  showDisclaimer = true,
  provider,
  secondaryAmountUsd,
  secondaryLabel,
}: CheckoutPriceDisplayProps) {
  const { locale } = useLocaleCurrency();
  const formatted = formatCheckoutAmount(amountUsd, currency, locale, rates);
  const secondaryFormatted =
    secondaryAmountUsd !== undefined
      ? formatCheckoutAmount(secondaryAmountUsd, currency, locale, rates)
      : null;

  return (
    <div className={cn("space-y-2", className)}>
      <p className={cn("font-heading text-3xl font-bold text-charcoal", amountClassName)}>
        {formatted}
      </p>
      {secondaryFormatted && secondaryLabel ? (
        <p className="text-sm text-slate">
          {secondaryLabel}:{" "}
          <span className="font-semibold text-charcoal">{secondaryFormatted}</span>
        </p>
      ) : null}
      {provider ? (
        <p className="text-xs text-slate">{formatChargeCurrencyLabel(provider, currency)}</p>
      ) : null}
      {showDisclaimer ? (
        <p className="text-xs leading-relaxed text-slate">{CHECKOUT_RATE_DISCLAIMER_RU}</p>
      ) : null}
    </div>
  );
}
