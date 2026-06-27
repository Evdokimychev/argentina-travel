"use client";

import TourSection from "@/components/tour-detail/TourSection";
import ExcursionDepartureCalendar from "@/components/excursions/ExcursionDepartureCalendar";
import ExcursionBookingPricingSection from "@/components/excursions/ExcursionBookingPricingSection";
import ExcursionAdditionalServicesSection from "@/components/excursions/ExcursionAdditionalServicesSection";
import ExcursionPrepaymentNotice from "@/components/excursions/ExcursionPrepaymentNotice";
import { useExcursionBooking } from "@/components/excursions/ExcursionBookingContext";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";

export default function ExcursionAvailableDatesSection() {
  const { t } = useLocaleCurrency();
  const {
    excursion,
    scheduleDates,
    scheduleLoading,
    scheduleError,
    selectedDate,
    setSelectedDate,
    setSelectedTime,
    quote,
    quoteLoading,
    canBookOnSite,
    isTripsterPartnerApiConfigured,
  } = useExcursionBooking();

  const showSection =
    excursion.partner === "tripster" && isTripsterPartnerApiConfigured && canBookOnSite;

  if (!showSection) return null;
  if (!scheduleLoading && (scheduleError || scheduleDates.length === 0)) return null;

  return (
    <TourSection id="available-dates" title={t("excursions.section.availableDates")}>
      <div className="space-y-5">
        <ExcursionDepartureCalendar
          scheduleDates={scheduleDates}
          selectedDate={selectedDate}
          loading={scheduleLoading}
          hideHeading
          onSelect={(date) => {
            setSelectedDate(date);
            setSelectedTime("");
          }}
        />
        <ExcursionBookingPricingSection
          excursion={excursion}
          quotePriceDescription={quote?.price_description}
        />
        <ExcursionAdditionalServicesSection
          ticketOptions={excursion.ticketOptions}
          priceCurrency={excursion.priceCurrency}
        />
        <ExcursionPrepaymentNotice
          excursionSlug={excursion.slug}
          quote={quote}
          quoteLoading={quoteLoading}
        />
      </div>
    </TourSection>
  );
}
