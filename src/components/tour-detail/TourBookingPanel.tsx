"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Info, Plane } from "lucide-react";
import { TourDetail, TourBookingMode } from "@/types";
import { DEFAULT_BOOKING_ADVANTAGES } from "@/data/booking-advantages";
import { formatDateShort } from "@/lib/utils";
import { formatDays, spotsWord, formatTouristsBooking } from "@/lib/pluralize";
import { cn } from "@/lib/cn";
import TourPriceDisplay from "./TourPriceDisplay";
import GuestCounter from "./GuestCounter";
import FormattedPrice from "@/components/FormattedPrice";
import BookingAdvantages from "./BookingAdvantages";
import SingleDatePicker from "@/components/ui/single-date-picker";
import { useTourBooking } from "./TourBookingContext";

type DateMode = "scheduled" | "custom";

interface TourBookingPanelProps {
  tour: TourDetail;
  className?: string;
}

function resolveInitialDateMode(mode: TourBookingMode | undefined): DateMode {
  if (mode === "on_request") return "custom";
  return "scheduled";
}

function canPickScheduled(mode: TourBookingMode | undefined): boolean {
  return mode === "scheduled" || mode === "both";
}

function canPickCustom(mode: TourBookingMode | undefined): boolean {
  return mode === "on_request" || mode === "both";
}

export default function TourBookingPanel({ tour, className }: TourBookingPanelProps) {
  const bookingMode = tour.bookingMode ?? "scheduled";
  const [dateMode, setDateMode] = useState<DateMode>(() => resolveInitialDateMode(bookingMode));
  const [customDate, setCustomDate] = useState<Date | null>(null);
  const {
    selectedDateId,
    setSelectedDateId,
    guests,
    setGuests,
    pricePerPersonUsd,
    originalPricePerPersonUsd,
    totalPriceUsd,
    totalOriginalPriceUsd,
  } = useTourBooking();

  const startLocation = tour.startLocation ?? tour.arrival.meetingPoint;
  const advantages = tour.bookingAdvantages ?? [...DEFAULT_BOOKING_ADVANTAGES];

  const priceSuffix = useMemo(() => {
    return `${formatTouristsBooking(guests)} за ${formatDays(tour.durationDays)}`;
  }, [tour.durationDays, guests]);

  const showModeToggle = bookingMode === "both";
  const showScheduledPicker = dateMode === "scheduled" && canPickScheduled(bookingMode);
  const showCustomPicker = dateMode === "custom" && canPickCustom(bookingMode);

  const bookLabel =
    dateMode === "custom" || bookingMode === "on_request"
      ? "Забронировать индивидуально"
      : "Забронировать";

  return (
    <div className={cn("rounded-2xl border border-gray-200 bg-white p-5 shadow-lg", className)}>
      <TourPriceDisplay
        priceUsd={totalPriceUsd}
        originalPriceUsd={totalOriginalPriceUsd}
        suffix={priceSuffix}
        showFrom={false}
      />
      {guests > 1 && (
        <p className="mt-1 text-xs text-slate">
          <FormattedPrice priceUsd={pricePerPersonUsd} className="text-xs text-slate" /> за туриста
          {originalPricePerPersonUsd != null && originalPricePerPersonUsd > pricePerPersonUsd && (
            <>
              {" "}
              <span className="line-through opacity-70">
                <FormattedPrice priceUsd={originalPricePerPersonUsd} className="text-xs" />
              </span>
            </>
          )}
        </p>
      )}

      {startLocation && (
        <div className="mt-5 border-t border-gray-100 pt-5">
          <p className="text-sm font-medium text-charcoal">Место начала тура</p>
          <p className="mt-1 text-sm text-slate">{startLocation}</p>
          <button
            type="button"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand/80"
          >
            <Plane className="h-4 w-4" aria-hidden />
            Узнать стоимость с билетами из вашего города
          </button>
        </div>
      )}

      <div className="mt-5 space-y-4 border-t border-gray-100 pt-5">
        {showModeToggle && (
          <div className="flex rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setDateMode("scheduled")}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                dateMode === "scheduled"
                  ? "bg-white text-charcoal shadow-sm"
                  : "text-slate hover:text-charcoal"
              )}
            >
              Групповой тур
            </button>
            <button
              type="button"
              onClick={() => setDateMode("custom")}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                dateMode === "custom"
                  ? "bg-white text-charcoal shadow-sm"
                  : "text-slate hover:text-charcoal"
              )}
            >
              Индивидуально
            </button>
          </div>
        )}

        {showScheduledPicker && tour.dates.length > 0 && (
          <div>
            <label htmlFor="tour-date-select" className="text-sm font-medium text-charcoal">
              Даты путешествия
            </label>
            <div className="relative mt-1.5">
              <select
                id="tour-date-select"
                value={selectedDateId}
                onChange={(e) => setSelectedDateId(e.target.value)}
                className="w-full appearance-none rounded-xl bg-gray-50 px-4 py-3 pr-10 text-sm text-charcoal focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/20"
              >
                {tour.dates.map((d) => (
                  <option key={d.id} value={d.id}>
                    {formatDateShort(d.startDate)} – {formatDateShort(d.endDate)} ({d.spotsLeft}{" "}
                    {spotsWord(d.spotsLeft)})
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
                aria-hidden
              />
            </div>
          </div>
        )}

        {showCustomPicker && (
          <div className="space-y-3">
            <div className="flex gap-3 rounded-xl bg-sky/10 p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />
              <div className="text-sm leading-relaxed text-charcoal">
                <p className="font-medium">Тур проводится индивидуально</p>
                {tour.requestDateFrom && tour.requestDateTo && (
                  <p className="mt-1 text-slate">
                    Доступны любые даты в период {formatDateShort(tour.requestDateFrom)} по{" "}
                    {formatDateShort(tour.requestDateTo)}
                  </p>
                )}
                <p className="mt-1 text-slate">
                  Свяжитесь с автором путешествия или оставьте заявку по кнопке ниже
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="tour-custom-date" className="text-sm font-medium text-charcoal">
                Желаемая дата начала
              </label>
              <SingleDatePicker
                id="tour-custom-date"
                value={customDate}
                onChange={setCustomDate}
                min={tour.requestDateFrom}
                max={tour.requestDateTo}
                placeholder="Выберите дату начала"
              />
            </div>
          </div>
        )}

        <GuestCounter
          value={guests}
          min={tour.groupMin}
          max={tour.groupMax}
          minimumAge={tour.minimumAge}
          onChange={setGuests}
        />
      </div>

      <BookingAdvantages items={advantages} className="mt-5 border-t border-gray-100 pt-5" />

      <Link
        href="/contacts"
        className="mt-5 block w-full rounded-xl bg-brand py-3.5 text-center text-sm font-semibold text-white transition-colors hover:bg-brand/90"
      >
        {bookLabel}
      </Link>
      <Link
        href="/contacts"
        className="mt-2 block w-full rounded-xl border border-gray-200 py-3 text-center text-sm font-medium text-charcoal hover:bg-gray-50"
      >
        Задать вопрос
      </Link>
    </div>
  );
}
