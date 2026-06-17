"use client";

import { useMemo, useState, type MouseEvent } from "react";
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
import TourPublicPriceDisplay from "./TourPublicPriceDisplay";
import GuestCounter from "./GuestCounter";
import FormattedPrice from "@/components/FormattedPrice";
import BookingAdvantages from "./BookingAdvantages";
import BookingDateSelector, { validateBookingDates } from "./BookingDateSelector";
import { useTourBooking } from "./TourBookingContext";
import {
  formatDatePriceRangeLabel,
  resolveTourDatePriceSummary,
} from "@/lib/tour-date-pricing";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import BookingWaitlistPrompt from "./BookingWaitlistPrompt";
import ExternalBookingButton from "./ExternalBookingButton";
import { DEFAULT_CUSTOM_BOOKING_HINT } from "@/lib/tour-custom-booking-link";
import { siteFormError } from "@/lib/site-feedback/normalize-error";
import type { SiteFeedbackMessage } from "@/types/site-feedback";

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
  const [bookingError, setBookingErrorState] = useState<SiteFeedbackMessage | null>(null);

  const setBookingError = (value: string | SiteFeedbackMessage | null) => {
    if (value === null) {
      setBookingErrorState(null);
      return;
    }
    setBookingErrorState(typeof value === "string" ? siteFormError(value) : value);
  };
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
    groupDiscountApplied,
    groupDiscountSavingsUsd,
    priceOnRequest,
    canJoinWaitlist,
    openWaitlist,
    usesExternalBooking,
    externalBookingLink,
    externalBookingHref,
  } = useTourBooking();

  const selectedDate = tour.dates.find((d) => d.id === selectedDateId);
  const datePriceSummary = resolveTourDatePriceSummary(tour.dates, tour.priceUsd);
  const datePriceRangeLabel = formatDatePriceRangeLabel(datePriceSummary, priceOnRequest);
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

  const bookingValidationError =
    usesExternalBooking && !externalBookingLink?.passContext
      ? null
      : validateBookingDates(tour, dateMode, customDate, guests, selectedDateId);

  const externalHint =
    externalBookingLink?.hint?.trim() || DEFAULT_CUSTOM_BOOKING_HINT;

  const primaryLabel = usesExternalBooking
    ? externalBookingLink?.label ?? "Забронировать на сайте организатора"
    : priceOnRequest
      ? "Запросить расчёт"
      : canJoinWaitlist && bookingValidationError
        ? "Встать в лист ожидания"
        : dateMode === "custom" || bookingMode === "on_request"
          ? "Забронировать индивидуально"
          : "Забронировать";

  function handleBookClick() {
    if (bookingValidationError) {
      setBookingError(bookingValidationError);
      return;
    }
    setBookingError(null);
    if (!openCheckout()) {
      setBookingError("Не удалось открыть бронирование. Проверьте дату и количество туристов.");
    }
  }

  function handleExternalBookingClick(event: MouseEvent<HTMLAnchorElement>) {
    if (bookingValidationError) {
      event.preventDefault();
      setBookingError(bookingValidationError);
      return;
    }
    setBookingError(null);
  }

  function handlePrimaryAction() {
    if (bookingValidationError && canJoinWaitlist) {
      setBookingError(bookingValidationError);
      openWaitlist();
      return;
    }
    handleBookClick();
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
      <TourPublicPriceDisplay
        priceUsd={priceOnRequest ? tour.priceUsd : totalPriceUsd}
        originalPriceUsd={priceOnRequest ? tour.originalPriceUsd : totalOriginalPriceUsd}
        priceOnRequest={priceOnRequest}
        priceFromPrefix={
          priceOnRequest
            ? tour.priceFromPrefix
            : dateMode === "scheduled" && !selectedDate
              ? tour.priceFromPrefix
              : false
        }
        suffix={priceOnRequest ? undefined : priceSuffix}
        showFrom={priceOnRequest ? false : dateMode === "scheduled" && !selectedDate && tour.priceFromPrefix}
        showDiscountRibbon={false}
        className={!priceOnRequest && percentOff != null ? "pt-2 pr-[4.75rem] sm:pt-3 sm:pr-20" : undefined}
      />
      {!priceOnRequest && dateMode === "scheduled" && datePriceRangeLabel ? (
        <p className="mt-1 text-xs text-slate">Диапазон по датам: {datePriceRangeLabel}</p>
      ) : null}
      {!priceOnRequest && dateMode === "scheduled" && selectedDate ? (
        <p className="mt-1 text-xs font-medium text-charcoal">
          Цена за выбранную дату:{" "}
          <FormattedPrice priceUsd={selectedDate.priceUsd} className="text-xs font-medium" /> / чел.
        </p>
      ) : null}
      {!priceOnRequest && guests > 1 && (
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
      {!priceOnRequest && groupDiscountApplied ? (
        <p className="mt-1 text-xs font-medium text-sky-dark">
          Групповая скидка −{" "}
          <FormattedPrice priceUsd={groupDiscountSavingsUsd} className="text-xs font-medium" /> на
          заявку
        </p>
      ) : null}

      {startLocation && (
        <div className="mt-5 border-t border-gray-100 pt-5">
          <p className="text-sm font-medium text-charcoal">Место начала тура</p>
          <p className="mt-1 text-sm text-slate">{startLocation}</p>
        </div>
      )}

      <div className="mt-5 space-y-4 border-t border-gray-100 pt-5">
        <BookingDateSelector
          tour={tour}
          idPrefix="panel"
          showDepartureCalendar={false}
          collapsible={bookingMode === "scheduled" && tour.dates.length > 0}
        />

        <GuestCounter
          value={guests}
          min={guestLimits.min}
          max={Math.max(guestLimits.min, guestLimits.max)}
          minimumAge={tour.minimumAge}
          hint={guestHint}
          onChange={setGuests}
        />

        {!previewMode && !usesExternalBooking && canJoinWaitlist ? (
          <BookingWaitlistPrompt />
        ) : null}
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
          {bookingError ? (
            <InlineFeedback
              variant="error"
              title={bookingError.title}
              description={bookingError.description}
              steps={bookingError.steps}
              className="mt-4"
            />
          ) : null}

          {usesExternalBooking && externalBookingHref && externalBookingLink ? (
            <>
              <p className="mt-4 text-xs leading-relaxed text-slate">{externalHint}</p>
              <ExternalBookingButton
                href={externalBookingHref}
                link={externalBookingLink}
                className="mt-3"
                onClick={handleExternalBookingClick}
              />
            </>
          ) : (
            <Button type="button" onClick={handlePrimaryAction} className="mt-5 w-full">
              {primaryLabel}
            </Button>
          )}
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
