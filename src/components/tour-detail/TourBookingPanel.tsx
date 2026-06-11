"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TourDetail } from "@/types";
import type { Tour } from "@/types/tour";
import { getDiscountPercent, hasDiscount } from "@/lib/discount";
import { formatDays, formatTouristsBooking, formatTouristsRange, formatSpots } from "@/lib/pluralize";
import { formatMinimumAgeSummary } from "@/lib/tour-age";
import { getGuestLimits } from "@/lib/tour-booking-spots";
import { buildTourContactHref } from "@/lib/tour-contact";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import TourPriceDisplay from "./TourPriceDisplay";
import GuestCounter from "./GuestCounter";
import FormattedPrice from "@/components/FormattedPrice";
import BookingAdvantages from "./BookingAdvantages";
import BookingDateSelector, { validateBookingDates } from "./BookingDateSelector";
import { useTourBooking } from "./TourBookingContext";

interface TourBookingPanelProps {
  tour: TourDetail;
  canonicalTour?: Tour | null;
  className?: string;
  previewMode?: boolean;
}

export default function TourBookingPanel({
  tour,
  canonicalTour,
  className,
  previewMode = false,
}: TourBookingPanelProps) {
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

  const priceSuffix = useMemo(() => {
    return `${formatTouristsBooking(guests)} за ${formatDays(tour.durationDays)}`;
  }, [tour.durationDays, guests]);

  const discounted = hasDiscount(totalOriginalPriceUsd, totalPriceUsd);
  const percentOff =
    discounted && totalOriginalPriceUsd
      ? getDiscountPercent(totalOriginalPriceUsd, totalPriceUsd)
      : null;

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
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 shadow-card sm:p-6",
        className
      )}
    >
      {percentOff != null ? (
        <span
          className="pointer-events-none absolute right-0 top-0 rounded-bl-2xl rounded-tr-[1.35rem] bg-brand px-3.5 py-2 text-sm font-bold leading-none tracking-tight text-white shadow-md sm:px-4 sm:py-2.5 sm:text-base"
          aria-label={`Скидка ${percentOff} процентов`}
        >
          −{percentOff}%
        </span>
      ) : null}
      <TourPriceDisplay
        priceUsd={totalPriceUsd}
        originalPriceUsd={totalOriginalPriceUsd}
        suffix={priceSuffix}
        showFrom={false}
        showDiscountRibbon={false}
        className={percentOff != null ? "pt-2 pr-[4.75rem] sm:pt-3 sm:pr-20" : undefined}
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

      <BookingAdvantages
        tour={tour}
        canonicalTour={canonicalTour}
        className="mt-5 border-t border-gray-100 pt-5"
      />

      {previewMode ? (
        <div className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-charcoal">
          Бронирование недоступно в режиме предпросмотра. Опубликуйте тур, чтобы принимать заявки.
        </div>
      ) : (
        <>
          {bookingError && (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{bookingError}</p>
          )}

          <Button type="button" onClick={handleBookClick} className="mt-5 w-full">
            {bookLabel}
          </Button>
          <Link
            href={buildTourContactHref(tour.slug)}
            className={cn(buttonVariants({ variant: "outline" }), "mt-2 w-full")}
          >
            Задать вопрос
          </Link>
        </>
      )}
    </div>
  );
}
