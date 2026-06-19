"use client";

import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import FormattedPrice from "@/components/FormattedPrice";
import { cn } from "@/lib/cn";
import {
  formatStoredCheckoutDisplayAmount,
  formatStoredCheckoutPayNowAmount,
  formatUsdLedgerAmount,
} from "@/lib/payments/checkout-currency";
import type { Booking } from "@/types/tourist";

interface BookingLedgerAmountProps {
  booking: Booking;
  priceUsd: number;
  className?: string;
  /** Показывать только USD, если снимка валюты нет. */
  compact?: boolean;
}

/** USD — учётная валюта; рядом — сумма в валюте оформления, если сохранена. */
export default function BookingLedgerAmount({
  booking,
  priceUsd,
  className,
  compact = false,
}: BookingLedgerAmountProps) {
  const { locale } = useLocaleCurrency();
  const snapshot = booking.metadata?.checkoutDisplay;

  if (!snapshot) {
    return <FormattedPrice priceUsd={priceUsd} className={className} />;
  }

  const display = formatStoredCheckoutDisplayAmount(snapshot, locale);
  const ledger = formatUsdLedgerAmount(priceUsd, locale);

  if (compact) {
    return (
      <span className={cn("inline-flex flex-col gap-0.5", className)}>
        <span className="font-medium text-charcoal">{display}</span>
        <span className="text-xs text-slate">учёт: {ledger}</span>
      </span>
    );
  }

  return (
    <span className={cn("inline-flex flex-col gap-0.5", className)}>
      <span className="font-semibold text-charcoal">{ledger}</span>
      <span className="text-xs text-slate">для туриста: {display}</span>
    </span>
  );
}

export function BookingLedgerPayNowAmount({
  booking,
  payNowUsd,
  className,
}: {
  booking: Booking;
  payNowUsd: number;
  className?: string;
}) {
  const { locale } = useLocaleCurrency();
  const snapshot = booking.metadata?.checkoutDisplay;

  if (!snapshot?.payNowDisplay) {
    return <FormattedPrice priceUsd={payNowUsd} className={className} />;
  }

  const display = formatStoredCheckoutPayNowAmount(snapshot, locale);
  const ledger = formatUsdLedgerAmount(payNowUsd, locale);

  return (
    <span className={cn("inline-flex flex-col gap-0.5", className)}>
      <span className="font-medium text-charcoal">{display}</span>
      <span className="text-xs text-slate">учёт: {ledger}</span>
    </span>
  );
}
