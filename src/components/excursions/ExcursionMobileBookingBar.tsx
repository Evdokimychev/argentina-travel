"use client";

import PartnerTourBookingPriceSummary from "@/components/tour-detail/PartnerTourBookingPriceSummary";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { useExcursionBooking } from "@/components/excursions/ExcursionBookingContext";

type ExcursionMobileBookingBarProps = {
  prefersAffiliate: boolean;
};

export default function ExcursionMobileBookingBar({
  prefersAffiliate,
}: ExcursionMobileBookingBarProps) {
  const { t } = useLocaleCurrency();
  const {
    excursion,
    bookingPrice,
    priceSuffix,
    quoteLoading,
    selectedDate,
    selectedTime,
    openBookingPreview,
    submitButtonLabel,
    offerCapabilities,
  } = useExcursionBooking();

  const hasDateAndTime = Boolean(selectedDate && selectedTime);

  const listedPriceLabel =
    excursion.priceDisplay?.trim() ||
    (excursion.priceValue != null
      ? `${Math.round(excursion.priceValue)}${excursion.priceCurrency ? ` ${excursion.priceCurrency}` : ""}`
      : null);
  const ctaLabel = offerCapabilities.primaryActionLabel;
  const bookingDisabled =
    offerCapabilities.bookingMode === "disabled" ||
    offerCapabilities.bookingMode === "information_only";

  function scrollToBooking() {
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleMobileBookClick() {
    if (selectedDate && selectedTime) {
      openBookingPreview();
      return;
    }
    scrollToBooking();
    window.setTimeout(() => {
      document.getElementById("excursion-booking-date")?.click();
    }, 350);
  }

  return (
    <div className="fixed [bottom:calc(var(--cookie-consent-offset,0px)+var(--public-mobile-nav-height,0px))] left-0 right-0 z-40 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom,0px)] shadow-lg backdrop-blur-sm transition-[bottom] duration-200 lg:hidden">
      <div className={cn(siteContainerClass, "flex items-center justify-between gap-3 py-2.5")}>
        <div className="min-w-0">
          {bookingPrice ? (
            <PartnerTourBookingPriceSummary
              price={bookingPrice}
              suffix={priceSuffix}
              size="sm"
              loading={quoteLoading && hasDateAndTime}
            />
          ) : listedPriceLabel ? (
            <p className="truncate font-heading text-lg font-bold text-charcoal">{listedPriceLabel}</p>
          ) : (
            <p className="text-xs text-slate">{t("excursions.priceOnPartner")}</p>
          )}
        </div>

        {bookingDisabled ? (
          <Button type="button" disabled className="min-h-11 max-w-[65%] shrink-0 rounded-xl px-5">
            {ctaLabel}
          </Button>
        ) : prefersAffiliate && excursion.bookingHref ? (
          <a
            href={excursion.bookingHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants(), "min-h-11 max-w-[65%] shrink-0 rounded-xl px-5 text-center")}
          >
            {ctaLabel}
          </a>
        ) : (
          <Button type="button" className="min-h-11 max-w-[65%] shrink-0 rounded-xl px-5" onClick={handleMobileBookClick}>
            {submitButtonLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
