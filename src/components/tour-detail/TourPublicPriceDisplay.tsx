"use client";

import FormattedPrice from "@/components/FormattedPrice";
import TourPriceDisplay from "./TourPriceDisplay";
import PriceOnRequestInfoButton from "./PriceOnRequestInfoButton";
import {
  TOUR_PRICE_ON_REQUEST_LABEL,
  resolveTourPriceFromPrefix,
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
  /** compact — карточки каталога; default — страница тура и боковая панель */
  density?: "default" | "compact";
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
  density = "default",
  className,
}: TourPublicPriceDisplayProps) {
  const effectiveShowFrom =
    showFrom ?? resolveTourPriceFromPrefix({ priceUsd, priceOnRequest, priceFromPrefix });
  const isCompact = density === "compact";
  const priceValueClass =
    size === "lg" && !isCompact
      ? "font-heading text-xl font-bold text-charcoal sm:text-2xl"
      : "font-bold text-charcoal text-lg";

  if (priceOnRequest) {
    return (
      <div className={cn("relative min-w-0", className)}>
        <div
          className={cn(
            "flex items-baseline gap-1",
            isCompact ? "flex-nowrap" : "flex-wrap"
          )}
        >
          <p className={cn(priceValueClass, isCompact && "leading-none")}>
            {TOUR_PRICE_ON_REQUEST_LABEL}
          </p>
          <PriceOnRequestInfoButton
            className={
              isCompact
                ? "h-5 w-5 shrink-0 translate-y-px"
                : size === "lg" && !isCompact
                  ? "h-7 w-7"
                  : "h-6 w-6"
            }
          />
        </div>

        {!isCompact && suffix ? (
          <p className={cn("mt-1 text-slate", size === "lg" ? "text-sm" : "text-xs")}>{suffix}</p>
        ) : null}
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

/** Компактная подпись для таблицы дат. */
export function TourPriceCell({
  priceUsd,
  priceOnRequest,
  className,
}: {
  priceUsd: number;
  priceOnRequest?: boolean;
  className?: string;
}) {
  if (priceOnRequest) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-slate", className)}>
        {TOUR_PRICE_ON_REQUEST_LABEL}
        <PriceOnRequestInfoButton className="h-5 w-5" />
      </span>
    );
  }
  return <FormattedPrice priceUsd={priceUsd} className={cn("font-semibold text-charcoal", className)} />;
}
