"use client";

import { cn } from "@/lib/cn";
import { resolvePartnerListedPriceParts } from "@/lib/tripster/partner-tour-price";
import type { TourDetail, TourListing } from "@/types";

interface PartnerTourPriceAmountLineProps {
  amount: string;
  unit?: string;
  className?: string;
  unitClassName?: string;
}

export function PartnerTourPriceAmountLine({
  amount,
  unit,
  className,
  unitClassName,
}: PartnerTourPriceAmountLineProps) {
  return (
    <p className={className}>
      {amount}
      {unit ? (
        <span className={cn("ml-1.5 text-sm font-normal text-slate", unitClassName)}>
          {unit}
        </span>
      ) : null}
    </p>
  );
}

interface PartnerTourListedPriceProps {
  tour: Pick<
    TourDetail | TourListing,
    | "partnerPriceValue"
    | "partnerPriceCurrency"
    | "partnerPriceDisplay"
    | "partnerPriceUnit"
  >;
  showFrom?: boolean;
  size?: "sm" | "lg";
  className?: string;
}

export default function PartnerTourListedPrice({
  tour,
  showFrom = false,
  size = "lg",
  className,
}: PartnerTourListedPriceProps) {
  const parts = resolvePartnerListedPriceParts(tour);
  if (!parts) return null;

  const amountClassName =
    size === "lg"
      ? "font-heading text-3xl font-bold text-charcoal"
      : "font-heading text-lg font-bold text-charcoal";

  return (
    <div className={className}>
      {showFrom ? <p className="text-sm text-slate">от</p> : null}
      <PartnerTourPriceAmountLine
        amount={parts.amount}
        unit={parts.unit}
        className={amountClassName}
      />
    </div>
  );
}
