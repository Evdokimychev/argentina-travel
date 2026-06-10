"use client";

import { useEffect, useState } from "react";
import { TourDetail, TourDatePrice } from "@/types";
import FormattedPrice from "@/components/FormattedPrice";
import { formatDateShortWithYear } from "@/lib/utils";
import { formatSpots } from "@/lib/pluralize";
import { cn } from "@/lib/cn";
import {
  dateFitsGuestCount,
  validateGuestsForScheduledBooking,
} from "@/lib/tour-booking-spots";
import { SectionHeading } from "./InfoModal";
import { useTourBooking } from "./TourBookingContext";
import type { Tour } from "@/types/tour";
import EarlyBookingDiscounts from "./EarlyBookingDiscounts";

interface DatesSectionProps {
  tour: TourDetail;
  canonicalTour?: Tour | null;
}

export default function DatesSection({ tour, canonicalTour }: DatesSectionProps) {
  const { dates } = tour;
  const bookingMode = tour.bookingMode ?? "scheduled";
  const { guests, selectedDateId, setSelectedDateId } = useTourBooking();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [guests, selectedDateId]);

  function handleSelect(date: TourDatePrice) {
    const selectionError = validateGuestsForScheduledBooking(tour, guests, date.id);
    if (selectionError) {
      setError(selectionError);
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
    <section id="dates" className="tour-section-target space-y-6">
      <SectionHeading
        title="Даты и цены"
        subtitle={
          isOnRequestOnly
            ? "Тур проводится индивидуально — выберите удобную дату в блоке бронирования"
            : "Выберите подходящую дату отправления"
        }
      />

      {canonicalTour ? <EarlyBookingDiscounts tour={canonicalTour} /> : null}

      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          {error}
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
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-pampas/50">
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
                      <FormattedPrice
                        priceUsd={date.priceUsd}
                        className="font-semibold text-charcoal"
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
                        {selected ? "Выбрано" : "Выбрать"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
