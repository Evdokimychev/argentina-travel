"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plane } from "lucide-react";
import { TourDetail } from "@/types";
import { DEFAULT_BOOKING_ADVANTAGES } from "@/data/booking-advantages";
import { formatDays, formatTouristsBooking, formatTouristsRange, formatSpots } from "@/lib/pluralize";
import { formatMinimumAgeSummary } from "@/lib/tour-age";
import { getGuestLimits } from "@/lib/tour-booking-spots";
import { cn } from "@/lib/cn";
import TourPriceDisplay from "./TourPriceDisplay";
import GuestCounter from "./GuestCounter";
import FormattedPrice from "@/components/FormattedPrice";
import BookingAdvantages from "./BookingAdvantages";
import BookingDateSelector, { validateBookingDates } from "./BookingDateSelector";
import { useTourBooking } from "./TourBookingContext";

interface TourBookingPanelProps {
  tour: TourDetail;
  className?: string;
}

export default function TourBookingPanel({ tour, className }: TourBookingPanelProps) {
  const bookingMode = tour.bookingMode ?? "scheduled";
  const [bookingError, setBookingError] = useState<string | null>(null);
  const {
    guests,
    setGuests,
    dateMode,
    customDate,
    selectedDateId,
    openCheckout,
    pricePerPersonUsd,
    originalPricePerPersonUsd,
    totalPriceUsd,
    totalOriginalPriceUsd,
  } = useTourBooking();

  const selectedDate = tour.dates.find((d) => d.id === selectedDateId);
  const guestLimits = getGuestLimits(tour, selectedDate, dateMode);
  const guestHint =
    dateMode === "scheduled" && selectedDate
      ? `${formatTouristsRange(guestLimits.min, guestLimits.max)}${tour.minimumAge ? `, ${formatMinimumAgeSummary(tour.minimumAge)}` : ""} · на эту дату ${formatSpots(selectedDate.spotsLeft)}`
      : undefined;

  const startLocation = tour.startLocation ?? tour.arrival.meetingPoint;
  const advantages = tour.bookingAdvantages ?? [...DEFAULT_BOOKING_ADVANTAGES];

  const priceSuffix = useMemo(() => {
    return `${formatTouristsBooking(guests)} за ${formatDays(tour.durationDays)}`;
  }, [tour.durationDays, guests]);

  const bookLabel =
    dateMode === "custom" || bookingMode === "on_request"
      ? "Забронировать индивидуально"
      : "Забронировать";

  function handleBookClick() {
    const dateError = validateBookingDates(
      tour,
      dateMode,
      customDate,
      guests,
      selectedDateId
    );
    if (dateError) {
      setBookingError(dateError);
      return;
    }
    setBookingError(null);
    if (!openCheckout()) {
      setBookingError("Не удалось открыть бронирование. Проверьте дату и количество туристов.");
    }
  }

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
        <BookingDateSelector tour={tour} idPrefix="panel" />

        <GuestCounter
          value={guests}
          min={guestLimits.min}
          max={Math.max(guestLimits.min, guestLimits.max)}
          minimumAge={tour.minimumAge}
          hint={guestHint}
          onChange={setGuests}
        />
      </div>

      <BookingAdvantages items={advantages} className="mt-5 border-t border-gray-100 pt-5" />

      {bookingError && (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{bookingError}</p>
      )}

      <button
        type="button"
        onClick={handleBookClick}
        className="mt-5 block w-full rounded-xl bg-brand py-3.5 text-center text-sm font-semibold text-white transition-colors hover:bg-brand/90"
      >
        {bookLabel}
      </button>
      <Link
        href="/contacts"
        className="mt-2 block w-full rounded-xl border border-gray-200 py-3 text-center text-sm font-medium text-charcoal hover:bg-gray-50"
      >
        Задать вопрос
      </Link>
    </div>
  );
}
