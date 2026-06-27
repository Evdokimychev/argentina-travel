"use client";

import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { isDuplicatePriceText } from "@/lib/excursion-price-display";
import type { ExcursionDetail } from "@/types/excursion";

type ExcursionBookingPricingSectionProps = {
  excursion: Pick<ExcursionDetail, "priceDescription" | "priceValue">;
  quotePriceDescription?: string | null;
  className?: string;
};

export default function ExcursionBookingPricingSection({
  excursion,
  quotePriceDescription,
  className,
}: ExcursionBookingPricingSectionProps) {
  const { t } = useLocaleCurrency();

  const pricingText = [quotePriceDescription, excursion.priceDescription].find(
    (text) => text?.trim() && !isDuplicatePriceText(text, excursion.priceValue ?? null)
  );

  if (!pricingText?.trim()) {
    return null;
  }

  return (
    <section className={className} aria-labelledby="excursion-pricing-rules">
      <h3 id="excursion-pricing-rules" className="text-sm font-medium text-charcoal">
        {t("excursions.section.bookingConditions")}
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-charcoal/90">{pricingText.trim()}</p>
    </section>
  );
}
