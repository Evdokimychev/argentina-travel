"use client";

import { useMemo } from "react";
import { formatDateRange } from "@/lib/utils";
import { formatSpots } from "@/lib/pluralize";
import { cn } from "@/lib/cn";
import { formatCompactUsd } from "@/lib/tour-date-pricing";
import { dateFitsGuestCount } from "@/lib/tour-booking-spots";
import type { TourDatePrice, TourDetail } from "@/types";

type PartnerTourScheduleDatePickerProps = {
  tour: TourDetail;
  dates: TourDatePrice[];
  selectedDateId: string;
  guests: number;
  loading?: boolean;
  onSelect: (dateId: string) => void;
  className?: string;
};

export default function PartnerTourScheduleDatePicker({
  tour,
  dates,
  selectedDateId,
  guests,
  loading = false,
  onSelect,
  className,
}: PartnerTourScheduleDatePickerProps) {
  const bookableDates = useMemo(
    () => dates.filter((date) => dateFitsGuestCount(date, guests, tour.groupMin)),
    [dates, guests, tour.groupMin]
  );
  const hasSelection = Boolean(selectedDateId);

  if (loading && dates.length === 0) {
    return (
      <div className={cn("space-y-2", className)}>
        <p className="text-sm font-medium text-charcoal">Дата заезда</p>
        <div className="grid gap-2">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-14 animate-pulse rounded-xl border border-gray-100 bg-gray-50"
            />
          ))}
        </div>
      </div>
    );
  }

  if (dates.length === 0) {
    return (
      <div className={cn("rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-950", className)}>
        Нет доступных дат заезда. Напишите организатору или попробуйте позже.
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-charcoal">Дата заезда</p>
      {!hasSelection ? (
        <p className="text-xs text-slate">Выберите одну из доступных дат заезда</p>
      ) : null}
      <div className="grid gap-2" role="radiogroup" aria-label="Дата заезда">
        {dates.map((date) => {
          const bookable = dateFitsGuestCount(date, guests, tour.groupMin);
          const selected = date.id === selectedDateId;
          const priceLabel =
            selected &&
            (!tour.priceOnRequest && date.priceUsd > 0
              ? formatCompactUsd(date.priceUsd)
              : date.partnerPriceValue != null
                ? `${Math.round(date.partnerPriceValue)} ${date.partnerPriceCurrency ?? ""}`.trim()
                : null);

          return (
            <button
              key={date.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!bookable}
              onClick={() => onSelect(date.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition-colors",
                selected
                  ? "border-sky bg-sky/5 text-charcoal ring-2 ring-sky/20"
                  : hasSelection
                    ? "border-gray-200 bg-white text-charcoal hover:border-sky/30 hover:bg-sky/[0.02]"
                    : "border-dashed border-gray-300 bg-gray-50/70 text-charcoal hover:border-sky/40 hover:bg-white",
                !bookable && "cursor-not-allowed opacity-50"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                  selected ? "border-sky" : "border-gray-300 bg-white"
                )}
                aria-hidden
              >
                {selected ? <span className="h-2 w-2 rounded-full bg-sky" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block", selected ? "font-semibold text-charcoal" : "font-medium")}>
                  {formatDateRange(date.startDate, date.endDate)}
                </span>
                <span className="mt-0.5 block text-xs text-slate">
                  {formatSpots(date.spotsLeft)}
                </span>
              </span>
              {priceLabel ? (
                <span className="shrink-0 pt-0.5 text-xs font-medium text-slate">{priceLabel}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {bookableDates.length === 0 ? (
        <p className="text-xs text-amber-900">
          На выбранное число туристов нет свободных мест — уменьшите группу или выберите другую дату.
        </p>
      ) : null}
    </div>
  );
}
