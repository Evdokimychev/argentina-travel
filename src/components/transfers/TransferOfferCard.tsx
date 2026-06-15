"use client";

import { ArrowUpRight, Car, Users, Wifi } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrencyAmount } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { TransferOffer } from "@/lib/intui/types";
import type { CurrencyCode, LocaleCode } from "@/types/locale";

type TransferOfferCardProps = {
  offer: TransferOffer;
  locale: LocaleCode;
  routeKey: string;
  labels: {
    book: string;
    capacity: string;
    luggage: string;
    duration: string;
    features: string;
  };
};

function resolveOfferCurrency(code: string): CurrencyCode {
  const normalized = code.trim().toUpperCase();
  const allowed: CurrencyCode[] = ["RUB", "USD", "EUR", "ARS", "BRL", "CLP", "UYU", "GBP", "CAD", "AUD", "CHF"];
  return allowed.includes(normalized as CurrencyCode) ? (normalized as CurrencyCode) : "USD";
}

function formatDuration(minutes?: number): string | null {
  if (!minutes || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours && mins) return `${hours}ч ${mins}м`;
  if (hours) return `${hours}ч`;
  return `${mins}м`;
}

export default function TransferOfferCard({ offer, locale, routeKey, labels }: TransferOfferCardProps) {
  const priceLabel = formatCurrencyAmount(
    Math.round(offer.price),
    resolveOfferCurrency(offer.currency),
    locale
  );
  const duration = formatDuration(offer.durationMinutes);
  const bookHref = offer.bookPath
    ? `/api/affiliate/transfers/book?${new URLSearchParams({
        book: offer.bookPath,
        route: routeKey,
        locale,
      })}`
    : null;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-shadow hover:shadow-elevated sm:flex-row sm:items-center sm:justify-between">
      {offer.imageUrl ? (
        <div className="shrink-0 overflow-hidden rounded-xl sm:w-28">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={offer.imageUrl}
            alt={offer.vehicleName}
            className="h-20 w-full object-cover sm:h-24"
            loading="lazy"
          />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm text-slate">
          <Car className="h-4 w-4 shrink-0 text-sky" />
          <span className="font-medium text-charcoal">{offer.vehicleName}</span>
          {offer.vehicleClass ? <span>· {offer.vehicleClass}</span> : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate">
          {offer.capacity ? (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {labels.capacity.replace("{count}", String(offer.capacity))}
            </span>
          ) : null}
          {offer.luggage ? (
            <span>{labels.luggage.replace("{count}", String(offer.luggage))}</span>
          ) : null}
          {duration ? <span>{labels.duration.replace("{value}", duration)}</span> : null}
        </div>

        {offer.features.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {offer.features.slice(0, 4).map((feature) => (
              <span
                key={feature}
                className="inline-flex items-center gap-1 rounded-full bg-sky/5 px-2.5 py-1 text-xs text-sky"
              >
                {feature.toLowerCase().includes("wifi") ? <Wifi className="h-3 w-3" /> : null}
                {feature}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
        <p className="font-heading text-2xl font-bold text-charcoal">{priceLabel}</p>
        {bookHref ? (
          <a
            href={bookHref}
            className={cn(buttonVariants({ variant: "default" }), "rounded-full px-6")}
          >
            {labels.book}
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </a>
        ) : null}
      </div>
    </article>
  );
}
