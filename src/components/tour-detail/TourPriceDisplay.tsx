"use client";

import FormattedPrice from "@/components/FormattedPrice";
import PriceOtherCurrenciesPopover from "./PriceOtherCurrenciesPopover";
import { getDiscountPercent, hasDiscount } from "@/lib/discount";
import { cn } from "@/lib/cn";

interface TourPriceDisplayProps {
  priceUsd: number;
  originalPriceUsd?: number;
  /** e.g. "за туриста за 10 дней" */
  suffix?: string;
  size?: "sm" | "lg";
  showFrom?: boolean;
  /** lg: ribbon overlay; booking panel uses its own corner badge */
  showDiscountRibbon?: boolean;
  className?: string;
}

export default function TourPriceDisplay({
  priceUsd,
  originalPriceUsd,
  suffix,
  size = "lg",
  showFrom = true,
  showDiscountRibbon = true,
  className,
}: TourPriceDisplayProps) {
  const discounted = hasDiscount(originalPriceUsd, priceUsd);
  const percentOff =
    discounted && originalPriceUsd
      ? getDiscountPercent(originalPriceUsd, priceUsd)
      : null;

  return (
    <div className={cn("relative", className)}>
      {discounted && percentOff != null && size === "lg" && showDiscountRibbon && (
        <span className="pointer-events-none absolute right-0 top-0 rounded-bl-lg bg-brand px-2.5 py-1 text-[11px] font-bold leading-none text-white shadow-sm">
          −{percentOff}%
        </span>
      )}

      {showFrom && size === "lg" && (
        <p className="text-sm text-slate">от</p>
      )}

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        {showFrom && size === "sm" && (
          <span className="text-xs text-slate">от</span>
        )}
        {discounted && originalPriceUsd && (
          <FormattedPrice
            priceUsd={originalPriceUsd}
            className={cn(
              "text-slate line-through decoration-brand/60",
              size === "lg" ? "text-sm" : "text-xs"
            )}
          />
        )}
        {size === "lg" ? (
          <PriceOtherCurrenciesPopover
            priceUsd={priceUsd}
            className="font-bold text-charcoal font-heading text-3xl"
          />
        ) : (
          <FormattedPrice
            priceUsd={priceUsd}
            className="font-bold text-charcoal text-lg"
          />
        )}
        {discounted && percentOff != null && size === "sm" && (
          <span className="rounded-md bg-brand/10 px-1.5 py-0.5 text-[11px] font-semibold text-brand">
            −{percentOff}%
          </span>
        )}
      </div>

      {suffix && (
        <p className={cn("text-slate", size === "lg" ? "text-sm" : "text-xs")}>
          {suffix}
        </p>
      )}
    </div>
  );
}
