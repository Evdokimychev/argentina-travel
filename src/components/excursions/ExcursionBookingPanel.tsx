"use client";

import GuestCounter from "@/components/tour-detail/GuestCounter";
import TourPriceDisplay from "@/components/tour-detail/TourPriceDisplay";
import ExcursionScheduleDatePicker from "@/components/excursions/ExcursionScheduleDatePicker";
import ExcursionBookingPanelSkeleton from "@/components/excursions/ExcursionBookingPanelSkeleton";
import { Button } from "@/components/ui/button";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { cn } from "@/lib/cn";
import { siteStickyPanelMaxHeightClass, siteStickyPanelTopClass } from "@/lib/site-container";
import { useExcursionBooking } from "@/components/excursions/ExcursionBookingContext";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { siteFormError } from "@/lib/site-feedback/normalize-error";
import type { SiteFeedbackMessage } from "@/types/site-feedback";
import { trackExcursionBookingClick } from "@/lib/analytics/gtm-events";
import { useState } from "react";

type ExcursionBookingPanelProps = {
  className?: string;
};

export default function ExcursionBookingPanel({ className }: ExcursionBookingPanelProps) {
  const { t, locale } = useLocaleCurrency();
  const [formError, setFormErrorState] = useState<SiteFeedbackMessage | null>(null);

  const setFormError = (value: string | SiteFeedbackMessage | null) => {
    if (value === null) {
      setFormErrorState(null);
      return;
    }
    setFormErrorState(typeof value === "string" ? siteFormError(value) : value);
  };

  const {
    excursion,
    scheduleDates,
    scheduleLoading,
    scheduleError,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    selectedSlots,
    persons,
    setPersons,
    maxPersons,
    quote,
    quoteLoading,
    priceIsEstimate,
    priceUsd,
    priceSuffix,
    partnerPriceFootnote,
    showFrom,
    listedPriceLabel,
    hasListedPrice,
    canBookOnSite,
    submitButtonLabel,
    openBookingPreview,
  } = useExcursionBooking();

  const scheduleDateKeys = scheduleDates.map((entry) => entry.date);

  const partnerDisclaimerKey =
    excursion.partner === "sputnik8"
      ? "excursions.partnerDisclaimer.sputnik8"
      : "excursions.partnerDisclaimer.tripster";

  const affiliateButtonLabel =
    excursion.partner === "tripster" ? "Забронировать на сайте" : t("excursions.book");

  function handleOpenPreview() {
    setFormError(null);
    trackExcursionBookingClick({
      slug: excursion.slug,
      title: excursion.title,
      action: canBookOnSite ? "preview" : "affiliate",
      placement: "booking_panel",
    });
    if (!openBookingPreview()) {
      if (!selectedDate || !selectedTime) {
        setFormError(t("excursions.booking.pickDateTime"));
      }
    }
  }

  return (
    <aside
      id="booking"
      className={cn(
        "rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:sticky lg:z-30 lg:self-start lg:overflow-y-auto",
        siteStickyPanelTopClass,
        siteStickyPanelMaxHeightClass,
        className
      )}
    >
      {priceUsd != null ? (
        <div className={quoteLoading && priceIsEstimate ? "opacity-70 transition-opacity" : undefined}>
          <TourPriceDisplay
            priceUsd={priceUsd}
            size="lg"
            showFrom={showFrom}
            suffix={priceSuffix}
            showDiscountRibbon={false}
          />
        </div>
      ) : hasListedPrice && listedPriceLabel ? (
        <p className="font-heading text-2xl font-bold text-charcoal">{listedPriceLabel}</p>
      ) : (
        <p className="text-sm text-slate">{t("excursions.priceOnPartner")}</p>
      )}

      {partnerPriceFootnote ? (
        <p className="mt-2 text-[11px] leading-relaxed text-slate/75">{partnerPriceFootnote}</p>
      ) : null}

      {canBookOnSite ? (
        <div className="mt-5 space-y-4">
          {scheduleLoading ? (
            <ExcursionBookingPanelSkeleton />
          ) : scheduleError || scheduleDates.length === 0 ? (
            <p className="text-sm text-slate">{t("excursions.booking.scheduleUnavailable")}</p>
          ) : (
            <>
              <ExcursionScheduleDatePicker
                dates={scheduleDateKeys}
                selectedDate={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setSelectedTime("");
                }}
                locale={locale}
                label={t("excursions.booking.date")}
                placeholder={t("excursions.booking.pickDate")}
              />

              {selectedDate && selectedSlots.length > 0 ? (
                <div>
                  <p className="mb-2 text-sm font-medium text-charcoal">{t("excursions.booking.time")}</p>
                  {!selectedTime ? (
                    <p className="mb-2 text-xs text-slate">{t("excursions.booking.pickTime")}</p>
                  ) : null}
                  <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                    {selectedSlots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setSelectedTime(slot.time)}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-xs font-medium transition",
                          selectedTime === slot.time
                            ? "border-sky bg-sky text-white"
                            : "border-gray-200 text-charcoal hover:border-sky/40"
                        )}
                      >
                        {slot.time}
                        {slot.timeEnd ? `–${slot.timeEnd}` : ""}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <GuestCounter value={persons} min={1} max={maxPersons} onChange={setPersons} />
            </>
          )}

          {formError ? (
            <InlineFeedback
              variant="error"
              title={formError.title}
              description={formError.description}
              steps={formError.steps}
              action={formError.action}
            />
          ) : null}

          <Button
            type="button"
            className="w-full"
            disabled={scheduleLoading}
            onClick={handleOpenPreview}
          >
            {submitButtonLabel}
          </Button>

          <p className="text-xs leading-relaxed text-slate">{t("excursions.booking.disclaimer")}</p>
        </div>
      ) : (
        <>
          <a
            href={excursion.bookingHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex w-full items-center justify-center rounded-xl bg-sky px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-sky/90"
          >
            {affiliateButtonLabel}
          </a>
          <p className="mt-3 text-xs leading-relaxed text-slate">{t(partnerDisclaimerKey)}</p>
        </>
      )}
    </aside>
  );
}
