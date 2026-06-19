"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";
import { TourDetail } from "@/types";
import type { Tour } from "@/types/tour";
import { formatTourBookingGuestsDays, formatTourists, formatTouristsRange, formatSpots } from "@/lib/pluralize";
import { formatMinimumAgeSummary } from "@/lib/tour-age";
import { getGuestLimits } from "@/lib/tour-booking-spots";
import { buildTourContactHref } from "@/lib/tour-contact";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useRandomAttentionPulse } from "@/hooks/useRandomAttentionPulse";
import TourBookingPriceSummary from "./TourBookingPriceSummary";
import TourPublicPriceDisplay from "./TourPublicPriceDisplay";
import GuestCounter from "./GuestCounter";
import DiscountPercentBadge from "./DiscountPercentBadge";
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
import { normalizeGroupDiscountSettings } from "@/lib/group-discount";
import PartnerTourBookingPriceSummary from "./PartnerTourBookingPriceSummary";
import PartnerTourListedPrice from "./PartnerTourListedPrice";
import { isPartnerTourDetail } from "@/lib/tripster/partner-tour-utils";
import { hasDiscount } from "@/lib/discount";

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
  const isPartnerTour = isPartnerTourDetail(tour);
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
    totalPriceUsd,
    totalOriginalPriceUsd,
    discountPercentOff,
    groupDiscountApplied,
    basePricePerPersonUsd,
    priceOnRequest,
    canJoinWaitlist,
    openWaitlist,
    usesExternalBooking,
    externalBookingLink,
    externalBookingHref,
    partnerBookingPrice,
    partnerPriceLoading,
    scheduleDates,
    openPartnerBookingPreview,
    partnerEditRequest,
  } = useTourBooking();

  const bookButtonPulseKey = useRandomAttentionPulse({
    enabled: !previewMode && !usesExternalBooking,
  });

  useEffect(() => {
    if (!partnerEditRequest) return;
    if (window.matchMedia("(max-width: 1023px)").matches) return;
    const sectionId =
      partnerEditRequest.target === "date" ? "panel-booking-date" : "panel-booking-guests";
    const timer = window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [partnerEditRequest]);

  const availableDates = isPartnerTour ? scheduleDates : tour.dates;
  const selectedDate = availableDates.find((d) => d.id === selectedDateId);
  const datePriceSummary = resolveTourDatePriceSummary(availableDates, tour.priceUsd);
  const datePriceRangeLabel = formatDatePriceRangeLabel(datePriceSummary, priceOnRequest);
  const guestLimits = getGuestLimits(tour, selectedDate, dateMode);
  const guestHint =
    dateMode === "scheduled" && selectedDate
      ? `${formatTouristsRange(guestLimits.min, guestLimits.max)}${tour.minimumAge ? `, ${formatMinimumAgeSummary(tour.minimumAge)}` : ""} · на эту дату ${formatSpots(selectedDate.spotsLeft)}`
      : isPartnerTour
        ? `${formatTouristsRange(guestLimits.min, guestLimits.max)}${tour.minimumAge ? `, ${formatMinimumAgeSummary(tour.minimumAge)}` : ""}`
        : undefined;

  const startLocation = tour.startLocation ?? tour.arrival.meetingPoint;

  const priceSuffix = useMemo(() => {
    return formatTourBookingGuestsDays(guests, tour.durationDays);
  }, [tour.durationDays, guests]);

  const activeDiscountPercent = partnerBookingPrice
    ? partnerBookingPrice.discountPercent != null &&
      partnerBookingPrice.discountPercent > 0 &&
      partnerBookingPrice.originalTotalValue != null &&
      hasDiscount(partnerBookingPrice.originalTotalValue, partnerBookingPrice.totalValue)
      ? partnerBookingPrice.discountPercent
      : undefined
    : discountPercentOff;

  const totalBeforeGroupDiscountUsd = basePricePerPersonUsd * guests;
  const groupDiscountSettings = normalizeGroupDiscountSettings(tour.groupDiscount);
  const groupDiscountEnabled =
    !priceOnRequest &&
    (tour.groupDiscountEnabled ?? groupDiscountSettings.enabled);

  const bookingValidationError =
    usesExternalBooking && !externalBookingLink?.passContext
      ? null
      : validateBookingDates(
          { ...tour, dates: availableDates },
          dateMode,
          customDate,
          guests,
          selectedDateId
        );

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
    if (isPartnerTour) {
      event.preventDefault();
      if (bookingValidationError) {
        setBookingError(bookingValidationError);
        return;
      }
      setBookingError(null);
      if (!openPartnerBookingPreview()) {
        setBookingError("Выберите дату заезда и проверьте количество туристов.");
      }
      return;
    }

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
      id="booking"
      className={cn(
        "relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 shadow-card sm:p-6",
        className
      )}
    >
      {activeDiscountPercent != null ? (
        <DiscountPercentBadge percent={activeDiscountPercent} />
      ) : null}
      <div
        className={cn(
          activeDiscountPercent != null && "pr-[4.75rem] sm:pr-20"
        )}
      >
        {isPartnerTour && !selectedDate ? (
          <div>
            {tour.partnerPriceDisplay ? (
              <PartnerTourListedPrice tour={tour} showFrom />
            ) : (
              <p className="font-heading text-2xl font-bold text-charcoal">Стоимость по дате</p>
            )}
            {priceSuffix ? <p className="mt-1 text-sm text-slate">{priceSuffix}</p> : null}
            <p className="mt-2 text-xs leading-relaxed text-slate">
              Точная сумма появится после выбора даты заезда
            </p>
          </div>
        ) : partnerBookingPrice ? (
          <PartnerTourBookingPriceSummary
            price={partnerBookingPrice}
            suffix={priceSuffix}
            loading={partnerPriceLoading && Boolean(selectedDate)}
            className={activeDiscountPercent != null ? "pt-2 sm:pt-3" : undefined}
          />
        ) : priceOnRequest ? (
          <TourPublicPriceDisplay
            priceUsd={tour.priceUsd}
            originalPriceUsd={tour.originalPriceUsd}
            priceOnRequest
            priceFromPrefix={tour.priceFromPrefix}
            showDiscountRibbon={false}
          />
        ) : (
          <TourBookingPriceSummary
            priceUsd={totalPriceUsd}
            originalPriceUsd={totalOriginalPriceUsd}
            suffix={priceSuffix}
            showFrom={
              dateMode === "scheduled" && !selectedDate && Boolean(tour.priceFromPrefix)
            }
            groupDiscountApplied={groupDiscountApplied}
            groupDiscountEnabled={groupDiscountEnabled}
            groupDiscountHint={tour.groupDiscountHint}
            totalBeforeGroupDiscountUsd={totalBeforeGroupDiscountUsd}
            className={activeDiscountPercent != null ? "pt-2 sm:pt-3" : undefined}
          />
        )}

        {!priceOnRequest && !selectedDate && datePriceRangeLabel && !isPartnerTour ? (
          <p className="mt-2 text-xs leading-snug text-slate">
            Диапазон по датам: {datePriceRangeLabel}
          </p>
        ) : null}
      </div>

      {startLocation && (
        <div className="mt-5 border-t border-gray-100 pt-5">
          <p className="text-sm font-medium text-charcoal">Место начала тура</p>
          <p className="mt-1 text-sm text-slate">{startLocation}</p>
        </div>
      )}

      <div className="mt-5 space-y-4 border-t border-gray-100 pt-5">
        <div id="panel-booking-date">
          <BookingDateSelector
            tour={tour}
            idPrefix="panel"
            showDepartureCalendar={false}
            collapsible={
              !isPartnerTour && availableDates.length > 0 && bookingMode === "scheduled"
            }
          />
        </div>

        <div id="panel-booking-guests">
          <GuestCounter
            value={guests}
            min={guestLimits.min}
            max={Math.max(guestLimits.min, guestLimits.max)}
            minimumAge={tour.minimumAge}
            hint={guestHint}
            onChange={setGuests}
          />
        </div>

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
          ) : isPartnerTour ? null : (
            <Button
              key={bookButtonPulseKey}
              type="button"
              onClick={handlePrimaryAction}
              className={cn(
                "mt-5 w-full",
                bookButtonPulseKey > 0 && "animate-book-cta-pulse"
              )}
            >
              {primaryLabel}
            </Button>
          )}
          {!isPartnerTour ? (
            <Link
              href={buildTourContactHref(tour.slug)}
              className={cn(buttonVariants({ variant: "outline" }), "mt-2 w-full")}
            >
              Задать вопрос
            </Link>
          ) : null}
        </>
      )}
    </div>
  );
}
