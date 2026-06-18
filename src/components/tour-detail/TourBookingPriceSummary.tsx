"use client";

import FormattedPrice from "@/components/FormattedPrice";
import PriceOtherCurrenciesPopover from "./PriceOtherCurrenciesPopover";
import GroupDiscountAppliedBadge from "./GroupDiscountAppliedBadge";
import { getDiscountPercent, hasDiscount } from "@/lib/discount";
import { cn } from "@/lib/cn";

interface TourBookingPriceSummaryProps {
  priceUsd: number;
  originalPriceUsd?: number;
  suffix?: string;
  showFrom?: boolean;
  groupDiscountApplied: boolean;
  groupDiscountEnabled: boolean;
  groupDiscountHint?: string;
  totalBeforeGroupDiscountUsd: number;
  className?: string;
}

const BADGE_PILL_CLASS =
  "inline-flex min-h-[21px] items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium leading-snug";

function BookingGroupDiscountSlot({
  groupDiscountApplied,
  groupDiscountEnabled,
  groupDiscountHint,
  totalBeforeGroupDiscountUsd,
  totalPriceUsd,
}: Pick<
  TourBookingPriceSummaryProps,
  | "groupDiscountApplied"
  | "groupDiscountEnabled"
  | "groupDiscountHint"
  | "totalBeforeGroupDiscountUsd"
> & { totalPriceUsd: number }) {
  const groupDiscountPercentOff =
    groupDiscountApplied && totalBeforeGroupDiscountUsd > totalPriceUsd
      ? getDiscountPercent(totalBeforeGroupDiscountUsd, totalPriceUsd)
      : null;

  if (groupDiscountApplied) {
    return (
      <>
        <GroupDiscountAppliedBadge
          totalBeforeGroupDiscountUsd={totalBeforeGroupDiscountUsd}
          totalPriceUsd={totalPriceUsd}
          className="shrink-0 whitespace-nowrap"
        />
        {groupDiscountPercentOff != null && groupDiscountPercentOff > 0 ? (
          <span
            className={cn(
              BADGE_PILL_CLASS,
              "shrink-0 whitespace-nowrap border border-brand/15 bg-brand/10 font-semibold tabular-nums text-brand"
            )}
            title={`Дополнительная групповая скидка ${groupDiscountPercentOff}%`}
          >
            −{groupDiscountPercentOff}%
          </span>
        ) : null}
      </>
    );
  }

  if (groupDiscountEnabled) {
    return (
      <span
        className={cn(
          BADGE_PILL_CLASS,
          "border border-gray-100 bg-gray-50 text-slate"
        )}
      >
        {groupDiscountHint ?? "Скидка от 2 туристов"}
      </span>
    );
  }

  return (
    <span
      className={cn(BADGE_PILL_CLASS, "invisible border border-transparent")}
      aria-hidden
    >
      Групповая скидка применена
    </span>
  );
}

export default function TourBookingPriceSummary({
  priceUsd,
  originalPriceUsd,
  suffix,
  showFrom = false,
  groupDiscountApplied,
  groupDiscountEnabled,
  groupDiscountHint,
  totalBeforeGroupDiscountUsd,
  className,
}: TourBookingPriceSummaryProps) {
  const discounted = hasDiscount(originalPriceUsd, priceUsd);

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex min-h-5 items-center">
        {discounted && originalPriceUsd ? (
          <FormattedPrice
            priceUsd={originalPriceUsd}
            className="text-sm leading-snug text-slate line-through decoration-brand/60"
          />
        ) : (
          <span className="text-sm leading-snug invisible select-none" aria-hidden>
            —
          </span>
        )}
      </div>

      <div className="mt-0.5">
        {showFrom ? <p className="text-sm text-slate">от</p> : null}
        <PriceOtherCurrenciesPopover
          priceUsd={priceUsd}
          className="font-bold text-charcoal font-heading text-3xl"
        />
      </div>

      {suffix ? <p className="mt-1 text-sm text-slate">{suffix}</p> : null}

      <div className="mt-2 flex min-h-[21px] flex-nowrap items-center gap-2">
        <BookingGroupDiscountSlot
          groupDiscountApplied={groupDiscountApplied}
          groupDiscountEnabled={groupDiscountEnabled}
          groupDiscountHint={groupDiscountHint}
          totalBeforeGroupDiscountUsd={totalBeforeGroupDiscountUsd}
          totalPriceUsd={priceUsd}
        />
      </div>
    </div>
  );
}
