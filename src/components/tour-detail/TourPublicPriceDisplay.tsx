"use client";

import FormattedPrice from "@/components/FormattedPrice";
import TourPriceDisplay from "./TourPriceDisplay";
import {
  TOUR_PRICE_ON_REQUEST_HINT,
  TOUR_PRICE_ON_REQUEST_LABEL,
  TOUR_PRICE_ON_REQUEST_REFERENCE_HINT,
  resolveTourPriceFromPrefix,
  tourShowsReferencePrice,
} from "@/lib/tour-price-public";
import { cn } from "@/lib/cn";

interface TourPublicPriceDisplayProps {
  priceUsd: number;
  originalPriceUsd?: number;
  priceOnRequest?: boolean;
  priceFromPrefix?: boolean;
  suffix?: string;
  size?: "sm" | "lg";
  showFrom?: boolean;
  showDiscountRibbon?: boolean;
  className?: string;
}

export default function TourPublicPriceDisplay({
  priceUsd,
  originalPriceUsd,
  priceOnRequest = false,
  priceFromPrefix,
  suffix,
  size = "lg",
  showFrom,
  showDiscountRibbon = true,
  className,
}: TourPublicPriceDisplayProps) {
  const showsReference = tourShowsReferencePrice({ priceUsd, priceOnRequest, priceFromPrefix });
  const effectiveShowFrom =
    showFrom ?? resolveTourPriceFromPrefix({ priceUsd, priceOnRequest, priceFromPrefix });

  if (priceOnRequest && !showsReference) {
    return (
      <div className={cn("relative", className)}>
        <p
          className={cn(
            "font-bold text-charcoal",
            size === "lg" ? "font-heading text-2xl sm:text-3xl" : "text-lg"
          )}
        >
          {TOUR_PRICE_ON_REQUEST_LABEL}
        </p>
        <p className={cn("mt-1 text-slate", size === "lg" ? "text-sm" : "text-xs")}>
          {TOUR_PRICE_ON_REQUEST_HINT}
        </p>
        {suffix ? (
          <p className={cn("mt-1 text-slate", size === "lg" ? "text-sm" : "text-xs")}>{suffix}</p>
        ) : null}
      </div>
    );
  }

  if (priceOnRequest && showsReference) {
    return (
      <div className={cn("relative", className)}>
        <p className="text-sm font-medium text-violet-900">{TOUR_PRICE_ON_REQUEST_LABEL}</p>
        <div className="mt-1">
          <TourPriceDisplay
            priceUsd={priceUsd}
            originalPriceUsd={originalPriceUsd}
            size={size}
            showFrom={effectiveShowFrom}
            showDiscountRibbon={false}
            suffix={suffix}
          />
        </div>
        <p className={cn("mt-1 text-slate", size === "lg" ? "text-sm" : "text-xs")}>
          {TOUR_PRICE_ON_REQUEST_REFERENCE_HINT}
        </p>
      </div>
    );
  }

  return (
    <TourPriceDisplay
      priceUsd={priceUsd}
      originalPriceUsd={originalPriceUsd}
      suffix={suffix}
      size={size}
      showFrom={effectiveShowFrom}
      showDiscountRibbon={showDiscountRibbon}
      className={className}
    />
  );
}

/** Компактная подпись для таблиц дат и списков. */
export function TourPriceCell({
  priceUsd,
  priceOnRequest,
  className,
}: {
  priceUsd: number;
  priceOnRequest?: boolean;
  className?: string;
}) {
  if (priceOnRequest && priceUsd <= 0) {
    return <span className={cn("text-slate", className)}>{TOUR_PRICE_ON_REQUEST_LABEL}</span>;
  }
  if (priceOnRequest) {
    return (
      <span className={className}>
        <span className="block text-xs text-violet-800">{TOUR_PRICE_ON_REQUEST_LABEL}</span>
        <FormattedPrice priceUsd={priceUsd} className="font-semibold text-charcoal" />
      </span>
    );
  }
  return <FormattedPrice priceUsd={priceUsd} className={cn("font-semibold text-charcoal", className)} />;
}
