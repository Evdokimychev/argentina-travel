"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TourDetail } from "@/types";
import { formatDateRange } from "@/lib/utils";
import { formatTouristsBooking } from "@/lib/pluralize";
import { formatMinimumAgeSummary } from "@/lib/tour-age";
import { getGuestLimits } from "@/lib/tour-booking-spots";
import { cn } from "@/lib/cn";
import TourPublicPriceDisplay from "./TourPublicPriceDisplay";
import GuestCounter from "./GuestCounter";
import { useTourBooking } from "./TourBookingContext";
import BookingDateSelector, { validateBookingDates } from "./BookingDateSelector";
import ExternalBookingButton from "./ExternalBookingButton";
import { DEFAULT_CUSTOM_BOOKING_HINT } from "@/lib/tour-custom-booking-link";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { siteFormError } from "@/lib/site-feedback/normalize-error";
import type { SiteFeedbackMessage } from "@/types/site-feedback";

function formatMobileDateSummary(
  tour: TourDetail,
  dateMode: ReturnType<typeof useTourBooking>["dateMode"],
  selectedDateId: string,
  customDate: Date | null
): string {
  if (dateMode === "custom") {
    if (customDate) {
      return new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "short",
      }).format(customDate);
    }
    return "Выберите дату";
  }

  const selected = tour.dates.find((d) => d.id === selectedDateId);
  if (selected) {
    return formatDateRange(selected.startDate, selected.endDate);
  }

  return tour.dates.length > 0 ? "Выберите дату" : "Даты по запросу";
}

export default function MobileBookingBar({ tour }: { tour: TourDetail }) {
  const {
    totalPriceUsd,
    totalOriginalPriceUsd,
    openCheckout,
    dateMode,
    customDate,
    guests,
    setGuests,
    selectedDateId,
    canJoinWaitlist,
    openWaitlist,
    usesExternalBooking,
    externalBookingLink,
    externalBookingHref,
  } = useTourBooking();
  const priceOnRequest = Boolean(tour.priceOnRequest);
  const [expanded, setExpanded] = useState(false);
  const [error, setErrorState] = useState<SiteFeedbackMessage | null>(null);

  const setError = (value: string | SiteFeedbackMessage | null) => {
    if (value === null) {
      setErrorState(null);
      return;
    }
    setErrorState(typeof value === "string" ? siteFormError(value) : value);
  };

  const selectedDate = tour.dates.find((d) => d.id === selectedDateId);
  const guestLimits = getGuestLimits(tour, selectedDate, dateMode);
  const guestHint =
    dateMode === "scheduled" && selectedDate
      ? `${formatTouristsBooking(guests)}${tour.minimumAge ? `, ${formatMinimumAgeSummary(tour.minimumAge)}` : ""}`
      : undefined;

  const dateSummary = useMemo(
    () => formatMobileDateSummary(tour, dateMode, selectedDateId, customDate),
    [tour, dateMode, selectedDateId, customDate]
  );

  const bookingValidationError =
    usesExternalBooking && !externalBookingLink?.passContext
      ? null
      : validateBookingDates(tour, dateMode, customDate, guests, selectedDateId);

  function handleExternalBookingClick(event: MouseEvent<HTMLAnchorElement>) {
    if (bookingValidationError) {
      event.preventDefault();
      setError(bookingValidationError);
      setExpanded(true);
      return;
    }
    setError(null);
  }

  function handleBookClick() {
    if (bookingValidationError) {
      setError(bookingValidationError);
      setExpanded(true);
      return;
    }
    setError(null);
    if (!openCheckout()) {
      setError(
        siteFormError("Не удалось открыть бронирование", {
          steps: ["Выберите дату и количество туристов", "Попробуйте обновить страницу"],
        })
      );
    }
  }

  function handlePrimaryAction() {
    if (usesExternalBooking) return;
    if (bookingValidationError && canJoinWaitlist) {
      setError(bookingValidationError);
      openWaitlist();
      return;
    }
    handleBookClick();
  }

  const primaryLabel = usesExternalBooking
    ? externalBookingLink?.label ?? "Забронировать на сайте организатора"
    : priceOnRequest
      ? "Запросить расчёт"
      : canJoinWaitlist && bookingValidationError
        ? "Лист ожидания"
        : "Забронировать";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white shadow-lg lg:hidden">
      {expanded ? (
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="mx-auto max-w-7xl space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-charcoal">Дата и туристы</p>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="flex items-center gap-1 text-xs font-medium text-slate hover:text-charcoal"
              >
                Свернуть
                <ChevronDown className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <BookingDateSelector tour={tour} idPrefix="mobile-bar" />
            <GuestCounter
              value={guests}
              min={guestLimits.min}
              max={Math.max(guestLimits.min, guestLimits.max)}
              minimumAge={tour.minimumAge}
              hint={guestHint}
              onChange={setGuests}
            />
            <a
              href="#dates"
              onClick={() => setExpanded(false)}
              className="block text-center text-xs font-medium text-sky hover:underline"
            >
              Все даты тура
            </a>
          </div>
        </div>
      ) : null}

      <div className="p-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-2">
          {error ? (
            <InlineFeedback
              variant="error"
              title={error.title}
              description={error.description}
              steps={error.steps}
            />
          ) : null}

          {!expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-left transition-colors hover:border-brand/40 hover:bg-white"
              )}
            >
              <span className="min-w-0 truncate text-xs text-charcoal">
                <span className="font-medium">{dateSummary}</span>
                <span className="text-slate"> · {formatTouristsBooking(guests)}</span>
              </span>
              <ChevronUp className="h-4 w-4 shrink-0 text-slate" aria-hidden />
            </button>
          ) : null}

          <div className="flex items-center justify-between gap-4">
            <TourPublicPriceDisplay
              priceUsd={priceOnRequest ? tour.priceUsd : totalPriceUsd}
              originalPriceUsd={priceOnRequest ? tour.originalPriceUsd : totalOriginalPriceUsd}
              priceOnRequest={priceOnRequest}
              priceFromPrefix={tour.priceFromPrefix}
              size="sm"
              showFrom={false}
            />
            {usesExternalBooking && externalBookingHref && externalBookingLink ? (
              <ExternalBookingButton
                href={externalBookingHref}
                link={externalBookingLink}
                className="flex-1 rounded-xl py-3 text-sm font-semibold"
                onClick={handleExternalBookingClick}
              />
            ) : (
              <button
                type="button"
                onClick={handlePrimaryAction}
                className="flex-1 rounded-xl bg-sky py-3 text-center text-sm font-semibold text-white hover:bg-sky-dark"
              >
                {primaryLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
