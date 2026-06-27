"use client";

import { useMemo } from "react";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import {
  formatExcursionServicePrice,
  resolveExcursionAdditionalServices,
} from "@/lib/excursion-calendar";
import type { ExcursionTicketOption } from "@/types/excursion";

type ExcursionAdditionalServicesSectionProps = {
  ticketOptions: ExcursionTicketOption[];
  priceCurrency?: string;
  className?: string;
};

export default function ExcursionAdditionalServicesSection({
  ticketOptions,
  priceCurrency,
  className,
}: ExcursionAdditionalServicesSectionProps) {
  const { t } = useLocaleCurrency();
  const services = useMemo(
    () => resolveExcursionAdditionalServices(ticketOptions),
    [ticketOptions]
  );

  if (services.length === 0) {
    return null;
  }

  const currency = priceCurrency?.trim().toUpperCase() || "USD";

  return (
    <section className={className} aria-labelledby="excursion-additional-services">
      <h3 id="excursion-additional-services" className="text-sm font-medium text-charcoal">
        {t("excursions.section.additionalServices")}
      </h3>
      <ul className="mt-2 space-y-2">
        {services.map((service) => {
          const priceLabel = formatExcursionServicePrice(service, currency);

          return (
            <li
              key={service.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-surface-muted/40 px-3 py-2.5"
            >
              <span className="min-w-0 text-xs leading-relaxed text-charcoal">{service.title}</span>
              {priceLabel ? (
                <span className="shrink-0 text-xs font-semibold tabular-nums text-charcoal">
                  {priceLabel}
                  <span className="font-normal text-slate"> / шт.</span>
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[11px] leading-relaxed text-slate">
        {t("excursions.additionalServices.hint")}
      </p>
    </section>
  );
}
