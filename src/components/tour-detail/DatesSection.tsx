"use client";

import { useEffect, useState } from "react";
import { TourDetail, TourDatePrice } from "@/types";
import { TourPriceCell } from "./TourPublicPriceDisplay";
import { formatDateShortWithYear } from "@/lib/utils";
import { formatSpots } from "@/lib/pluralize";
import { cn } from "@/lib/cn";
import {
  dateFitsGuestCount,
  validateGuestsForScheduledBooking,
} from "@/lib/tour-booking-spots";
import {
  formatDatePriceRangeLabel,
  resolveTourDatePriceSummary,
} from "@/lib/tour-date-pricing";
import TourDepartureCalendar from "./TourDepartureCalendar";
import TourDepartureCountdown from "./TourDepartureCountdown";
import TourSection from "./TourSection";
import { ChevronDown, ChevronUp, CalendarDays } from "lucide-react";
import { useTourBooking } from "./TourBookingContext";
import type { Tour } from "@/types/tour";
import EarlyBookingDiscounts from "./EarlyBookingDiscounts";
import GroupDiscountPanel from "./GroupDiscountPanel";
import { normalizeGroupDiscountSettings } from "@/lib/group-discount";
import { isWaitlistFeatureEnabled } from "@/lib/tour-waitlist";

interface DatesSectionProps {
  tour: TourDetail;
  canonicalTour?: Tour | null;
  organizerComment?: string;
}

export default function DatesSection({ tour, canonicalTour, organizerComment }: DatesSectionProps) {
  const { dates } = tour;
  const bookingMode = tour.bookingMode ?? "scheduled";
  const { guests, selectedDateId, setSelectedDateId, canJoinWaitlist, openWaitlist } =
    useTourBooking();
  const [error, setError] = useState<string | null>(null);

  const priceSummary = resolveTourDatePriceSummary(dates, tour.priceUsd);
  const priceRangeLabel = formatDatePriceRangeLabel(priceSummary, tour.priceOnRequest);
  const showCalendar = dates.length > 1;
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    setError(null);
  }, [guests, selectedDateId]);

  function handleSelect(date: TourDatePrice) {
    const selectionError = validateGuestsForScheduledBooking(tour, guests, date.id);
    if (selectionError) {
      setError(selectionError);
      if (isWaitlistFeatureEnabled(tour)) {
        setSelectedDateId(date.id);
      }
      return;
    }

    setError(null);
    setSelectedDateId(date.id);
  }

  const isOnRequestOnly =
    dates.length === 0 && (bookingMode === "on_request" || bookingMode === "both");

  if (dates.length === 0 && !isOnRequestOnly) {
    return null;
  }

  return (
    <TourSection
      id="dates"
      title="Даты и цены"
      organizerComment={organizerComment}
      subtitle={
        isOnRequestOnly
          ? "Тур проводится индивидуально — выберите удобную дату в блоке бронирования"
          : priceRangeLabel
            ? `Стоимость зависит от даты заезда: ${priceRangeLabel}`
            : "Выберите подходящую дату отправления"
      }
    >
      {priceSummary.hasVariedPrices && !tour.priceOnRequest ? (
        <p className="mb-4 rounded-xl border border-sky/15 bg-sky/5 px-4 py-3 text-sm text-charcoal">
          На разные даты действуют разные цены — они указаны в календаре и таблице ниже.
        </p>
      ) : null}

      {canonicalTour ? <EarlyBookingDiscounts tour={canonicalTour} /> : null}
      {normalizeGroupDiscountSettings(tour.groupDiscount).enabled && !tour.priceOnRequest ? (
        <div className="mb-4">
          <GroupDiscountPanel
            settings={tour.groupDiscount}
            basePriceUsd={tour.priceUsd}
            guestCount={guests}
          />
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="mb-4 space-y-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          <p>{error}</p>
          {canJoinWaitlist ? (
            <button
              type="button"
              onClick={openWaitlist}
              className="rounded-lg border border-sky/20 bg-white px-3 py-1.5 text-xs font-medium text-sky-dark transition-colors hover:border-sky/40"
            >
              Встать в лист ожидания
            </button>
          ) : null}
        </div>
      ) : null}

      {isOnRequestOnly ? (
        <div className="rounded-2xl border border-dashed border-sky/30 bg-sky/5 px-6 py-8 text-center">
          <p className="font-medium text-charcoal">Даты по запросу</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate">
            Организатор подберёт удобные даты под ваш график. Укажите желаемую дату в форме
            бронирования справа или внизу экрана.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <TourDepartureCountdown tour={tour} />

          {showCalendar ? (
            <div className="rounded-2xl border border-gray-200 bg-white">
              <button
                type="button"
                onClick={() => setCalendarOpen((open) => !open)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                aria-expanded={calendarOpen}
              >
                <span className="inline-flex items-center gap-2 text-sm font-medium text-charcoal">
                  <CalendarDays className="h-4 w-4 text-sky" aria-hidden />
                  Календарь отправлений
                  <span className="font-normal text-slate">({dates.length})</span>
                </span>
                {calendarOpen ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-slate" aria-hidden />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate" aria-hidden />
                )}
              </button>
              {calendarOpen ? (
                <div className="border-t border-gray-100 p-3 sm:p-4">
                  <TourDepartureCalendar
                    dates={dates}
                    selectedDateId={selectedDateId}
                    guests={guests}
                    groupMin={tour.groupMin}
                    durationDays={tour.durationDays}
                    priceOnRequest={tour.priceOnRequest}
                    onSelect={handleSelect}
                    className="border-0 p-0 shadow-none"
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-surface-muted/50">
                <th className="px-5 py-3 font-medium text-slate">Начало</th>
                <th className="px-5 py-3 font-medium text-slate">Окончание</th>
                <th className="px-5 py-3 font-medium text-slate">Мест</th>
                <th className="px-5 py-3 font-medium text-slate">Цена</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {dates.map((date) => {
                const bookable = dateFitsGuestCount(date, guests, tour.groupMin);
                const selected = selectedDateId === date.id;

                return (
                  <tr
                    key={date.id}
                    className={cn(
                      "border-b border-gray-50 transition-colors",
                      selected && "bg-sky/5",
                      bookable && !selected && "hover:bg-gray-50",
                      !bookable && "bg-gray-50/40"
                    )}
                  >
                    <td className="px-5 py-4 font-medium text-charcoal">
                      {formatDateShortWithYear(date.startDate)}
                    </td>
                    <td className="px-5 py-4 text-slate">
                      {formatDateShortWithYear(date.endDate)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-medium",
                          !bookable && "bg-wine/10 text-wine",
                          bookable && date.spotsLeft <= 3 && "bg-wine/10 text-wine",
                          bookable && date.spotsLeft > 3 && "bg-emerald-50 text-emerald-700"
                        )}
                      >
                        {formatSpots(date.spotsLeft)}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-charcoal">
                      <TourPriceCell
                        priceUsd={date.priceUsd}
                        priceOnRequest={tour.priceOnRequest}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleSelect(date)}
                        aria-disabled={!bookable}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                          selected && "bg-sky text-white",
                          !selected && bookable && "border border-gray-200 hover:bg-gray-50",
                          !selected &&
                            !bookable &&
                            "border border-gray-200 bg-gray-100 text-slate hover:bg-gray-100"
                        )}
                      >
                        {selected ? "Выбрано" : bookable ? "Выбрать" : tour.waitlistEnabled ? "Очередь" : "Нет мест"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </div>
      )}
    </TourSection>
  );
}
