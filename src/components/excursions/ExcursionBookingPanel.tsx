"use client";

import GuestCounter from "@/components/tour-detail/GuestCounter";
import PartnerTourBookingPriceSummary from "@/components/tour-detail/PartnerTourBookingPriceSummary";
import ExcursionScheduleDatePicker from "@/components/excursions/ExcursionScheduleDatePicker";
import ExcursionBookingPanelSkeleton from "@/components/excursions/ExcursionBookingPanelSkeleton";
import { Button } from "@/components/ui/button";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { cn } from "@/lib/cn";
import { useExcursionBooking } from "@/components/excursions/ExcursionBookingContext";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { siteFormError } from "@/lib/site-feedback/normalize-error";
import type { SiteFeedbackMessage } from "@/types/site-feedback";
import { trackExcursionBookingClick } from "@/lib/analytics/gtm-events";
import { useRef, useState } from "react";

type ExcursionBookingPanelProps = {
  className?: string;
  placement?: "mobile" | "desktop";
};

export default function ExcursionBookingPanel({
  className,
  placement = "desktop",
}: ExcursionBookingPanelProps) {
  const { t, locale } = useLocaleCurrency();
  const panelRef = useRef<HTMLDivElement>(null);
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
    quoteLoading,
    bookingPrice,
    priceSuffix,
    partnerPriceFootnote,
    listedPriceLabel,
    hasListedPrice,
    canBookOnSite,
    submitButtonLabel,
    offerCapabilities,
    openBookingPreview,
  } = useExcursionBooking();

  const hasDateAndTime = Boolean(selectedDate && selectedTime);
  const scheduleDateKeys = scheduleDates.map((entry) => entry.date);

  const partnerDisclaimerKey =
    excursion.partner === "sputnik8"
      ? "excursions.partnerDisclaimer.sputnik8"
      : "excursions.partnerDisclaimer.tripster";

  const affiliateButtonLabel = offerCapabilities.primaryActionLabel;

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
        window.requestAnimationFrame(() => {
          if (!selectedDate) {
            panelRef.current?.querySelector<HTMLButtonElement>("[data-excursion-booking-date]")?.click();
            return;
          }
          panelRef.current?.querySelector<HTMLElement>("[data-excursion-booking-time]")?.focus();
        });
      }
    }
  }

  return (
    <div
      ref={panelRef}
      id={placement === "mobile" ? "booking" : undefined}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 shadow-card sm:p-6",
        className
      )}
    >
      {bookingPrice ? (
        <PartnerTourBookingPriceSummary
          price={bookingPrice}
          suffix={priceSuffix}
          loading={quoteLoading && hasDateAndTime}
        />
      ) : hasListedPrice && listedPriceLabel ? (
        <p className="font-heading text-2xl font-bold text-charcoal">{listedPriceLabel}</p>
      ) : (
        <p className="text-sm text-slate">{t("excursions.priceOnPartner")}</p>
      )}

      {partnerPriceFootnote ? (
        <p className="mt-2 text-[11px] leading-relaxed text-slate/75">{partnerPriceFootnote}</p>
      ) : null}

      {offerCapabilities.bookingMode === "disabled" ||
      offerCapabilities.bookingMode === "information_only" ? (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-charcoal">
            {offerCapabilities.primaryActionLabel}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate">
            {offerCapabilities.disabledReason ?? offerCapabilities.disclosure}
          </p>
        </div>
      ) : canBookOnSite ? (
        <div className="mt-5 space-y-4">
          {scheduleLoading ? (
            <ExcursionBookingPanelSkeleton />
          ) : scheduleError || scheduleDates.length === 0 ? (
            <p className="text-sm text-slate">{t("excursions.booking.scheduleUnavailable")}</p>
          ) : (
            <>
              <ExcursionScheduleDatePicker
                triggerId={placement === "mobile" ? "excursion-booking-date" : undefined}
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
                        data-excursion-booking-time
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
    </div>
  );
}
