"use client";

import FormattedPrice from "@/components/FormattedPrice";
import { getDiscountPercent, hasDiscount } from "@/lib/discount";
import { cn } from "@/lib/cn";

interface TourPriceDisplayProps {
  priceUsd: number;
  originalPriceUsd?: number;
  /** e.g. "за туриста за 10 дней" */
  suffix?: string;
  size?: "sm" | "lg";
  showFrom?: boolean;
  className?: string;
}

export default function TourPriceDisplay({
  priceUsd,
  originalPriceUsd,
  suffix,
  size = "lg",
  showFrom = true,
  className,
}: TourPriceDisplayProps) {
  const discounted = hasDiscount(originalPriceUsd, priceUsd);
  const percentOff =
    discounted && originalPriceUsd
      ? getDiscountPercent(originalPriceUsd, priceUsd)
      : null;

  return (
    <div className={cn("relative", className)}>
      {discounted && percentOff != null && size === "lg" && (
        <span className="absolute -right-1 -top-1 rotate-6 rounded-md bg-brand px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
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
        <FormattedPrice
          priceUsd={priceUsd}
          className={cn(
            "font-bold text-charcoal",
            size === "lg" ? "font-display text-3xl" : "text-lg"
          )}
        />
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
