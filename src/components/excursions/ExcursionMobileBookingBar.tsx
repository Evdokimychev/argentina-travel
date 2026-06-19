"use client";

import TourPriceDisplay from "@/components/tour-detail/TourPriceDisplay";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { excursionPriceSuffixKey } from "@/lib/excursion-listing-meta";
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
    priceUsd,
    selectedDate,
    selectedTime,
    openBookingPreview,
    submitButtonLabel,
  } = useExcursionBooking();

  const showFrom = excursion.priceFrom !== false;
  const priceUnit = excursion.priceUnit ?? "per_person";
  const listedPriceLabel =
    excursion.priceDisplay?.trim() ||
    (excursion.priceValue != null
      ? `${Math.round(excursion.priceValue)}${excursion.priceCurrency ? ` ${excursion.priceCurrency}` : ""}`
      : null);
  const ctaLabel =
    excursion.partner === "tripster" && excursion.tripsterPartnerApiConfigured
      ? "Забронировать на сайте"
      : t("excursions.book");

  function scrollToBooking() {
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleMobileBookClick() {
    if (selectedDate && selectedTime) {
      openBookingPreview();
      return;
    }
    scrollToBooking();
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 shadow-lg backdrop-blur-sm lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          {priceUsd != null ? (
            <TourPriceDisplay
              priceUsd={priceUsd}
              size="sm"
              showFrom={showFrom}
              suffix={t(excursionPriceSuffixKey(priceUnit))}
            />
          ) : listedPriceLabel ? (
            <p className="truncate font-heading text-lg font-bold text-charcoal">{listedPriceLabel}</p>
          ) : (
            <p className="text-xs text-slate">{t("excursions.priceOnPartner")}</p>
          )}
        </div>

        {prefersAffiliate && excursion.bookingHref ? (
          <a
            href={excursion.bookingHref}
            className={cn(buttonVariants(), "shrink-0 rounded-xl px-5")}
          >
            {ctaLabel}
          </a>
        ) : (
          <Button type="button" className="shrink-0 rounded-xl px-5" onClick={handleMobileBookClick}>
            {submitButtonLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
