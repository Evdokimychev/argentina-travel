"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TourDetail } from "@/types";
import { formatDateRange } from "@/lib/utils";
import { formatTourists } from "@/lib/pluralize";
import PartnerTourBookingPriceSummary from "./PartnerTourBookingPriceSummary";
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

function formatMobileDateSummary(
  dates: TourDetail["dates"],
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

  const selected = dates.find((d) => d.id === selectedDateId);
  if (selected) {
    return formatDateRange(selected.startDate, selected.endDate);
  }

  return dates.length > 0 ? "Выберите дату" : "Даты по запросу";
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
    partnerPriceLoading,
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

  const availableDates = isPartnerTour ? scheduleDates : tour.dates;
  const selectedDate = availableDates.find((d) => d.id === selectedDateId);
  const guestLimits = getGuestLimits(tour, selectedDate, dateMode);
  const guestHint =
    dateMode === "scheduled" && selectedDate
      ? `${formatTourists(guests)}${tour.minimumAge ? `, ${formatMinimumAgeSummary(tour.minimumAge)}` : ""}`
      : undefined;

  const dateSummary = useMemo(
    () => formatMobileDateSummary(availableDates, dateMode, selectedDateId, customDate),
    [availableDates, dateMode, selectedDateId, customDate]
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

  const showFromPrefix = resolveTourPriceFromPrefix({
    priceUsd: tour.priceUsd,
    priceOnRequest,
    priceFromPrefix: tour.priceFromPrefix,
  });
  const displayPriceUsd = priceOnRequest ? tour.priceUsd : totalPriceUsd;

  return (
    <div className={tourDetailMobileBarClass}>
      {expanded ? (
        <div className="border-b border-gray-100 py-3">
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
              <BookingDateSelector tour={tour} idPrefix="mobile-bar" />
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

      <div className="py-2.5">
        <div className={cn(siteContainerClass, "flex flex-col gap-2")}>
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
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-1 text-left text-xs text-slate transition-colors hover:bg-gray-50 hover:text-charcoal"
            >
              <span className="min-w-0 truncate">
                <span className="font-medium text-charcoal">{dateSummary}</span>
                <span> · {formatTourists(guests)}</span>
              </span>
              <ChevronUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
            </button>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            {partnerBookingPrice ? (
              <div className="min-w-0 shrink">
                <PartnerTourBookingPriceSummary
                  price={partnerBookingPrice}
                  loading={partnerPriceLoading}
                  size="sm"
                />
              </div>
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
              <p className="min-w-0 truncate text-base font-semibold text-charcoal">
                {showFromPrefix ? <span className="font-normal text-slate">от </span> : null}
                <FormattedPrice priceUsd={displayPriceUsd} className="tabular-nums" />
              </p>
            )}
            {usesExternalBooking && externalBookingHref && externalBookingLink ? (
              <ExternalBookingButton
                href={externalBookingHref}
                link={externalBookingLink}
                label={offerCapabilities.primaryActionLabel}
                className="flex-1 rounded-xl py-3 text-sm font-semibold"
                onClick={handleExternalBookingClick}
              />
            ) : (
              <button
                type="button"
                onClick={handlePrimaryAction}
                disabled={offerCapabilities.bookingMode === "disabled"}
                className={cn(
                  "min-h-11 flex-1 rounded-xl bg-sky-ink py-3 text-center text-sm font-semibold text-white hover:bg-sky-ink/90",
                  offerCapabilities.bookingMode === "disabled" &&
                    "cursor-not-allowed bg-gray-300 text-slate hover:bg-gray-300",
                )}
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
