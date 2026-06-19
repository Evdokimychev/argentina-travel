"use client";

import type { ReactNode } from "react";
import PriceOtherCurrenciesPopover from "./PriceOtherCurrenciesPopover";
import { hasDiscount } from "@/lib/discount";
import {
  formatPartnerBookingAmount,
  resolvePartnerListedPriceParts,
} from "@/lib/tripster/partner-tour-price";
import { PartnerTourPriceAmountLine } from "./PartnerTourListedPrice";
import type { PartnerTourBookingPrice } from "@/lib/tripster/partner-tour-price";
import { cn } from "@/lib/cn";

interface PartnerTourBookingPriceSummaryProps {
  price: PartnerTourBookingPrice;
  suffix?: string;
  loading?: boolean;
  className?: string;
  size?: "sm" | "lg";
}

function renderNativeAmount(
  value: number,
  currency: string,
  className: string
): ReactNode {
  if (currency === "USD") {
    return <PriceOtherCurrenciesPopover priceUsd={value} className={className} />;
  }

  return (
    <span className={className}>{formatPartnerBookingAmount(value, currency)}</span>
  );
}

export default function PartnerTourBookingPriceSummary({
  price,
  suffix,
  loading = false,
  className,
  size = "lg",
}: PartnerTourBookingPriceSummaryProps) {
  const hasNumericTotal = price.totalValue > 0 || !price.displayFallback;
  const discounted =
    hasNumericTotal &&
    price.originalTotalValue != null &&
    hasDiscount(price.originalTotalValue, price.totalValue);

  const mainClassName =
    size === "lg"
      ? "font-bold text-charcoal font-heading text-3xl"
      : "font-bold text-charcoal text-lg";

  const strikeClassName =
    size === "lg"
      ? "text-sm leading-snug text-slate line-through decoration-brand/60"
      : "text-xs text-slate line-through decoration-brand/60";

  return (
    <div className={cn("min-w-0", loading && "opacity-60 transition-opacity", className)}>
      {hasNumericTotal ? (
        <div className="flex min-h-5 items-center">
          {discounted && price.originalTotalValue ? (
            renderNativeAmount(price.originalTotalValue, price.currency, strikeClassName)
          ) : (
            <span className="text-sm leading-snug invisible select-none" aria-hidden>
              —
            </span>
          )}
        </div>
      ) : null}

      <div className={cn(!hasNumericTotal && "mt-0")}>
        {price.showFrom ? <p className="text-sm text-slate">от</p> : null}
        {price.displayFallback ? (
          (() => {
            const parts = resolvePartnerListedPriceParts({
              partnerPriceDisplay: price.displayFallback,
            });
            if (!parts) {
              return <p className={mainClassName}>{price.displayFallback}</p>;
            }
            return (
              <PartnerTourPriceAmountLine
                amount={parts.amount}
                unit={parts.unit}
                className={mainClassName}
              />
            );
          })()
        ) : (
          renderNativeAmount(price.totalValue, price.currency, mainClassName)
        )}
      </div>

      {suffix ? <p className="mt-1 text-sm text-slate">{suffix}</p> : null}

      {price.perPersonLabel ? (
        <p className="mt-1 text-xs text-slate">{price.perPersonLabel}</p>
      ) : null}
    </div>
  );
}
