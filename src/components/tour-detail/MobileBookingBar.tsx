"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TourDetail } from "@/types";
import { formatDateRange } from "@/lib/utils";
import { formatTourists } from "@/lib/pluralize";
import { formatMinimumAgeSummary } from "@/lib/tour-age";
import { getGuestLimits } from "@/lib/tour-booking-spots";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";
import { tourDetailMobileBarClass } from "@/lib/tour-detail-ui";
import TourPublicPriceDisplay from "./TourPublicPriceDisplay";
import FormattedPrice from "@/components/FormattedPrice";
import { resolveTourPriceFromPrefix } from "@/lib/tour-price-public";
import GuestCounter from "./GuestCounter";
import { useTourBooking } from "./TourBookingContext";
import BookingDateSelector, { validateBookingDates } from "./BookingDateSelector";
import ExternalBookingButton from "./ExternalBookingButton";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { siteFormError } from "@/lib/site-feedback/normalize-error";
import type { SiteFeedbackMessage } from "@/types/site-feedback";
import { isPartnerTourDetail } from "@/lib/tripster/partner-tour-utils";
import { trackTourBookingClick } from "@/lib/analytics/gtm-events";
import { formatPartnerBookingAmount } from "@/lib/tripster/partner-tour-price";

function formatMobileDateSummary(
  dates: TourDetail["dates"],
  dateMode: ReturnType<typeof useTourBooking>["dateMode"],
  selectedDateId: string,
  customDate: Date | null,
  options?: { partnerScheduled?: boolean },
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

  const selected = dates.find((d) => d.id === selectedDateId);
  if (selected) {
    return formatDateRange(selected.startDate, selected.endDate);
  }

  if (dates.length > 0) return "Выберите дату";
  // Partner scheduled tours without future dates are not "on request".
  if (options?.partnerScheduled) return "Нет доступных дат";
  return "Даты по запросу";
}

export default function MobileBookingBar({ tour }: { tour: TourDetail }) {
  const isPartnerTour = isPartnerTourDetail(tour);
  const {
    productKind,
    totalPriceUsd,
    openCheckout,
    dateMode,
    customDate,
    guests,
    setGuests,
    selectedDateId,
    canJoinWaitlist,
    openWaitlist,
    offerCapabilities,
    usesExternalBooking,
    externalBookingLink,
    externalBookingHref,
    partnerBookingPrice,
    scheduleDates,
    partnerPreviewOpen,
    openPartnerBookingPreview,
    partnerEditRequest,
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

  useEffect(() => {
    if (partnerPreviewOpen) {
      setExpanded(false);
    }
  }, [partnerPreviewOpen]);

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [expanded]);

  useEffect(() => {
    if (!partnerEditRequest) return;
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    setExpanded(true);
    const sectionId =
      partnerEditRequest.target === "date"
        ? "mobile-bar-booking-date"
        : "mobile-bar-booking-guests";
    const timer = window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [partnerEditRequest]);

  const availableDates = scheduleDates;
  const selectedDate = availableDates.find((d) => d.id === selectedDateId);
  const guestLimits = getGuestLimits(tour, selectedDate, dateMode);
  const guestHint =
    dateMode === "scheduled" && selectedDate
      ? `${formatTourists(guests)}${tour.minimumAge ? `, ${formatMinimumAgeSummary(tour.minimumAge)}` : ""}`
      : undefined;

  const dateSummary = useMemo(
    () =>
      formatMobileDateSummary(availableDates, dateMode, selectedDateId, customDate, {
        partnerScheduled:
          isPartnerTour && (tour.bookingMode ?? "scheduled") === "scheduled",
      }),
    [availableDates, dateMode, selectedDateId, customDate, isPartnerTour, tour.bookingMode],
  );

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

  function handleExternalBookingClick(event: MouseEvent<HTMLAnchorElement>) {
    if (isPartnerTour) {
      event.preventDefault();
      if (bookingValidationError) {
        setError(bookingValidationError);
        setExpanded(true);
        return;
      }
      setError(null);
      setExpanded(false);
      trackTourBookingClick({
        slug: tour.slug,
        title: tour.title,
        action: "partner_preview",
        placement: "mobile_bar",
      });
      if (!openPartnerBookingPreview()) {
        setError("Выберите дату заезда и проверьте количество туристов.");
        setExpanded(true);
      }
      return;
    }

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
    trackTourBookingClick({
      slug: tour.slug,
      title: tour.title,
      action: "checkout",
      placement: "mobile_bar",
    });
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
    ? offerCapabilities.primaryActionLabel
    : offerCapabilities.bookingMode === "disabled"
      ? offerCapabilities.primaryActionLabel
      : canJoinWaitlist && bookingValidationError
        ? "Лист ожидания"
        : offerCapabilities.primaryActionLabel;
  const compactPrimaryLabel =
    primaryLabel.length > 20
      ? "Продолжить"
      : primaryLabel;

  const showFromPrefix = resolveTourPriceFromPrefix({
    priceUsd: tour.priceUsd,
    priceOnRequest,
    priceFromPrefix: tour.priceFromPrefix,
  });
  const displayPriceUsd = priceOnRequest ? tour.priceUsd : totalPriceUsd;
  const compactPartnerPrice = partnerBookingPrice
    ? partnerBookingPrice.displayFallback ??
      formatPartnerBookingAmount(
        partnerBookingPrice.totalValue,
        partnerBookingPrice.currency
      )
    : null;

  return (
    <>
      {expanded ? (
        <button
          type="button"
          className="fixed inset-0 z-[39] bg-charcoal/25 lg:hidden"
          aria-label="Свернуть выбор даты и туристов"
          onClick={() => setExpanded(false)}
        />
      ) : null}
      <div className={tourDetailMobileBarClass} data-mobile-booking-bar>
      {expanded ? (
        <div id="mobile-booking-controls" className="border-b border-gray-100 py-3">
          <div className={cn(siteContainerClass, "space-y-3")}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-charcoal">Дата и туристы</p>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs font-medium text-slate hover:bg-gray-50 hover:text-charcoal"
              >
                Свернуть
                <ChevronDown className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div id="mobile-bar-booking-date">
              <BookingDateSelector
                tour={tour}
                idPrefix="mobile-bar"
                showDepartureCalendar={false}
              />
            </div>
            <div id="mobile-bar-booking-guests">
              <GuestCounter
                value={guests}
                min={guestLimits.min}
                max={Math.max(guestLimits.min, guestLimits.max)}
                minimumAge={tour.minimumAge}
                hint={guestHint}
                onChange={setGuests}
              />
            </div>
            {!isPartnerTour ? (
              <a
                href="#dates"
                onClick={() => setExpanded(false)}
                className="flex min-h-11 items-center justify-center text-center text-xs font-medium text-sky-ink hover:underline"
              >
                Все даты {productKind === "excursion" ? "экскурсии" : "тура"}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="py-2">
        <div className={cn(siteContainerClass, "space-y-2")}>
          {error ? (
            <InlineFeedback
              variant="error"
              title={error.title}
              description={error.description}
              steps={error.steps}
            />
          ) : null}

          <div className="flex min-h-12 items-center gap-2">
            <div className="min-w-0 flex-1">
              {compactPartnerPrice ? (
                <p className="truncate text-base font-semibold text-charcoal">
                  {compactPartnerPrice}
                </p>
              ) : priceOnRequest ? (
                <TourPublicPriceDisplay
                  priceUsd={tour.priceUsd}
                  originalPriceUsd={tour.originalPriceUsd}
                  priceOnRequest
                  priceFromPrefix={tour.priceFromPrefix}
                  size="sm"
                  showFrom={false}
                />
              ) : (
                <p className="truncate text-base font-semibold text-charcoal">
                  {showFromPrefix ? <span className="font-normal text-slate">от </span> : null}
                  <FormattedPrice priceUsd={displayPriceUsd} className="tabular-nums" />
                </p>
              )}
              <p className="mt-0.5 truncate text-[11px] leading-tight text-slate">
                {dateSummary} · {formatTourists(guests)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              aria-expanded={expanded}
              aria-controls="mobile-booking-controls"
              aria-label={expanded ? "Свернуть выбор даты и туристов" : "Изменить дату и туристов"}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate transition-colors hover:border-sky/30 hover:text-charcoal"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" aria-hidden />
              ) : (
                <ChevronUp className="h-4 w-4" aria-hidden />
              )}
            </button>
            {usesExternalBooking && externalBookingHref && externalBookingLink ? (
              <ExternalBookingButton
                href={externalBookingHref}
                link={externalBookingLink}
                label={compactPrimaryLabel}
                ariaLabel={primaryLabel}
                className="min-h-12 min-w-0 flex-[1.15] rounded-xl px-2 py-2 text-xs font-semibold leading-tight sm:text-sm"
                onClick={handleExternalBookingClick}
              />
            ) : (
              <button
                type="button"
                onClick={handlePrimaryAction}
                disabled={offerCapabilities.bookingMode === "disabled"}
                className={cn(
                  "min-h-12 min-w-0 flex-[1.15] rounded-xl bg-sky-ink px-2 py-2 text-center text-xs font-semibold leading-tight text-white hover:bg-sky-ink/90 sm:text-sm",
                  offerCapabilities.bookingMode === "disabled" &&
                    "cursor-not-allowed bg-gray-300 text-slate hover:bg-gray-300",
                )}
              >
                {compactPrimaryLabel}
              </button>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
