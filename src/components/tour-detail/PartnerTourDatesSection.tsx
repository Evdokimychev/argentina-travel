"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ExternalLink } from "lucide-react";
import type { TourDetail, TourDatePrice } from "@/types";
import TourSection from "./TourSection";
import { useTourBooking } from "./TourBookingContext";
import { formatDateShortWithYear } from "@/lib/utils";
import { formatSpots } from "@/lib/pluralize";
import { cn } from "@/lib/cn";
import {
  dateFitsGuestCount,
  validateGuestsForScheduledBooking,
} from "@/lib/tour-booking-spots";
import { formatCompactUsd } from "@/lib/tour-date-pricing";
import {
  resolvePartnerDatesBookingLinkLabel,
  resolvePartnerScheduleSubtitle,
} from "@/lib/partner-tours/booking-brand";

function formatDateLabel(date: TourDatePrice): string {
  const start = formatDateShortWithYear(date.startDate);
  if (!date.endDate || date.endDate === date.startDate) return start;
  return `${start} — ${formatDateShortWithYear(date.endDate)}`;
}

export default function PartnerTourDatesSection({ tour }: { tour: TourDetail }) {
  const {
    guests,
    selectedDateId,
    setSelectedDateId,
    setDateMode,
    scheduleDates,
    scheduleLoading,
  } = useTourBooking();

  const dates = scheduleDates.filter((item) => item.startDate);
  const [visibleCount, setVisibleCount] = useState(6);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setVisibleCount(6);
    setError(null);
  }, [tour.slug]);

  useEffect(() => {
    setError(null);
  }, [guests, selectedDateId]);

  if (!dates.length && !scheduleLoading) return null;

  const bookingHref = tour.customBookingLink?.url ?? `/api/affiliate/go/${tour.slug}`;
  const selectedDate = dates.find((date) => date.id === selectedDateId);

  function handleSelect(date: TourDatePrice) {
    const selectionError = validateGuestsForScheduledBooking(
      { ...tour, dates },
      guests,
      date.id,
    );

    if (selectionError) {
      setError(selectionError);
      return;
    }

    setError(null);
    setDateMode("scheduled");
    setSelectedDateId(date.id);
  }

  return (
    <TourSection
      id="dates"
      title="Ближайшие даты"
      subtitle={
        selectedDate
          ? "Выбранная дата применена в блоке бронирования справа"
          : resolvePartnerScheduleSubtitle(tour)
      }
    >
      {scheduleLoading && dates.length === 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-[70px] animate-pulse rounded-2xl border border-gray-100 bg-gray-50"
            />
          ))}
        </div>
      ) : (
        <ul
          className="grid gap-3 sm:grid-cols-2"
          role="radiogroup"
          aria-label="Ближайшие даты заезда"
        >
          {dates.slice(0, visibleCount).map((date) => {
            const selected = date.id === selectedDateId;
            const bookable = dateFitsGuestCount(date, guests, tour.groupMin);
            const priceLabel =
              !tour.priceOnRequest && date.priceUsd > 0
                ? formatCompactUsd(date.priceUsd)
                : date.partnerPriceValue != null
                  ? `${Math.round(date.partnerPriceValue)} ${date.partnerPriceCurrency ?? ""}`.trim()
                  : null;

            return (
              <li key={date.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={!bookable}
                  onClick={() => handleSelect(date)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left shadow-sm transition-all",
                    selected
                      ? "border-sky bg-sky/5 ring-2 ring-sky/20"
                      : bookable
                        ? "border-gray-100 bg-white hover:border-sky/30 hover:bg-sky/[0.02]"
                        : "cursor-not-allowed border-gray-100 bg-gray-50/80 opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                      selected ? "border-sky bg-sky text-white" : "border-gray-300 bg-white",
                    )}
                    aria-hidden
                  >
                    {selected ? <Check className="h-3 w-3" strokeWidth={2.5} /> : null}
                  </span>

                  <span className="min-w-0 flex-1">
                    <p className={cn("font-medium", selected ? "text-sky-dark" : "text-charcoal")}>
                      {formatDateLabel(date)}
                    </p>
                    {date.spotsLeft > 0 ? (
                      <p className="mt-1 text-xs text-slate">{formatSpots(date.spotsLeft)}</p>
                    ) : (
                      <p className="mt-1 text-xs text-wine">Мест нет</p>
                    )}
                  </span>

                  {priceLabel ? (
                    <span className="shrink-0 pt-0.5 text-xs font-semibold text-charcoal">
                      {priceLabel}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {error ? (
        <p className="mt-3 rounded-xl border border-wine/15 bg-wine/5 px-4 py-3 text-sm text-wine">
          {error}
        </p>
      ) : null}

      {dates.length > visibleCount ? (
        <button
          type="button"
          onClick={() => setVisibleCount((count) => count + 6)}
          className="mt-4 text-sm font-medium text-sky hover:text-sky-dark"
        >
          Показать ещё даты
        </button>
      ) : null}

      <Link
        href={bookingHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-sky hover:text-sky-dark"
      >
        {resolvePartnerDatesBookingLinkLabel(tour, Boolean(selectedDate))}
        <ExternalLink className="h-4 w-4" aria-hidden />
      </Link>
    </TourSection>
  );
}
