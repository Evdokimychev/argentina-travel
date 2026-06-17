"use client";

import FormattedPrice from "@/components/FormattedPrice";
import TourPriceDisplay from "./TourPriceDisplay";
import PriceOnRequestInfoButton from "./PriceOnRequestInfoButton";
import {
  TOUR_PRICE_ON_REQUEST_LABEL,
  resolveTourPriceFromPrefix,
  tourShowsReferencePrice,
} from "@/lib/tour-price-public";
import { tourDetailInsetMutedClass } from "@/lib/tour-detail-ui";
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
  const showsReference = tourShowsReferencePrice({ priceUsd, priceOnRequest, priceFromPrefix });
  const effectiveShowFrom =
    showFrom ?? resolveTourPriceFromPrefix({ priceUsd, priceOnRequest, priceFromPrefix });
  const isCompact = density === "compact";
  const labelSizeClass =
    size === "lg" && !isCompact
      ? "font-heading text-xl font-bold sm:text-2xl"
      : isCompact
        ? "text-sm"
        : "text-lg";

  if (priceOnRequest) {
    return (
      <div className={cn("relative min-w-0", className)}>
        <div className="flex flex-wrap items-center gap-1">
          <p className={cn("font-bold text-charcoal", labelSizeClass)}>
            {TOUR_PRICE_ON_REQUEST_LABEL}
          </p>
          <PriceOnRequestInfoButton
            hasReferencePrice={showsReference}
            className={size === "lg" && !isCompact ? "h-7 w-7" : "h-6 w-6"}
          />
        </div>

        {showsReference ? (
          isCompact ? (
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5">
              {effectiveShowFrom ? (
                <span className="text-[11px] text-slate">от</span>
              ) : null}
              <FormattedPrice
                priceUsd={priceUsd}
                className="text-sm font-semibold text-charcoal"
              />
            </div>
          ) : (
            <div className={cn("mt-2.5", tourDetailInsetMutedClass, "px-3 py-2.5")}>
              <p className="text-xs font-medium text-slate">Ориентир для расчёта</p>
              <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5">
                {effectiveShowFrom ? (
                  <span className="text-xs text-slate">от</span>
                ) : null}
                <FormattedPrice
                  priceUsd={priceUsd}
                  className="text-lg font-semibold text-charcoal"
                />
              </div>
            </div>
          )
        ) : null}

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
  if (priceOnRequest && priceUsd <= 0) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-slate", className)}>
        {TOUR_PRICE_ON_REQUEST_LABEL}
        <PriceOnRequestInfoButton className="h-5 w-5" />
      </span>
    );
  }
  if (priceOnRequest) {
    return (
      <span className={cn("inline-flex flex-col gap-0.5", className)}>
        <span className="inline-flex items-center gap-1 text-xs text-slate">
          {TOUR_PRICE_ON_REQUEST_LABEL}
          <PriceOnRequestInfoButton hasReferencePrice className="h-5 w-5" />
        </span>
        <FormattedPrice priceUsd={priceUsd} className="font-semibold text-charcoal" />
      </span>
    );
  }
  return <FormattedPrice priceUsd={priceUsd} className={cn("font-semibold text-charcoal", className)} />;
}
