"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import {
  computePrepaymentPercents,
  type ExcursionBookingConditions,
} from "@/lib/tripster/booking-conditions";
import type { TripsterPriceQuote } from "@/lib/tripster/types";
import { cn } from "@/lib/cn";

type ExcursionPrepaymentNoticeProps = {
  excursionSlug: string;
  quote: TripsterPriceQuote | null;
  quoteLoading?: boolean;
  className?: string;
};

export default function ExcursionPrepaymentNotice({
  excursionSlug,
  quote,
  quoteLoading = false,
  className,
}: ExcursionPrepaymentNoticeProps) {
  const { t } = useLocaleCurrency();
  const [fallbackPercents, setFallbackPercents] = useState<{
    prepaymentPercent: number;
    restPercent: number;
  } | null>(null);

  const quoteSummary = useMemo(() => {
    if (!quote) return null;
    return computePrepaymentPercents(quote);
  }, [quote]);

  useEffect(() => {
    if (quoteSummary) {
      setFallbackPercents(null);
      return;
    }

    let cancelled = false;

    async function loadFallback() {
      try {
        const response = await fetch(`/api/excursions/${excursionSlug}/booking-conditions`);
        const data = (await response.json()) as ExcursionBookingConditions & { error?: string };
        if (!response.ok || cancelled) return;

        const prepaymentItem = data.items?.find((item) => item.kind === "prepayment");
        if (
          prepaymentItem?.prepaymentPercent != null &&
          prepaymentItem.restPercent != null
        ) {
          setFallbackPercents({
            prepaymentPercent: prepaymentItem.prepaymentPercent,
            restPercent: prepaymentItem.restPercent,
          });
        }
      } catch {
        if (!cancelled) setFallbackPercents(null);
      }
    }

    void loadFallback();
    return () => {
      cancelled = true;
    };
  }, [excursionSlug, quoteSummary]);

  const summary = quoteSummary ?? fallbackPercents;

  if (quoteLoading && !summary) {
    return (
      <p className={cn("text-center text-xs text-slate", className)}>
        {t("excursions.bookingConditions.loading")}
      </p>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <p className={cn("text-center text-xs leading-relaxed text-slate", className)}>
      {t("excursions.bookingConditions.prepayment")
        .replace("{prepay}", String(summary.prepaymentPercent))
        .replace("{rest}", String(summary.restPercent))}
    </p>
  );
}
