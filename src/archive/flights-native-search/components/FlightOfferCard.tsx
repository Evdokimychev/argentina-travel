"use client";

import { format, parseISO } from "date-fns";
import { enUS, es, ptBR, ru } from "date-fns/locale";
import { ArrowUpRight, Plane } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrencyAmount } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { FlightPriceOffer } from "@/lib/travelpayouts/aviasales/types";
import type { CurrencyCode, LocaleCode } from "@/types/locale";

const DATE_LOCALES = {
  ru,
  en: enUS,
  es,
  pt: ptBR,
} as const;

type FlightOfferCardProps = {
  offer: FlightPriceOffer;
  locale: LocaleCode;
  routeKey: string;
  labels: {
    book: string;
    direct: string;
    stops: string;
    departure: string;
    return: string;
  };
};

function formatFlightDate(iso: string, locale: LocaleCode): string {
  try {
    return format(parseISO(iso), "d MMM, HH:mm", { locale: DATE_LOCALES[locale] });
  } catch {
    return iso;
  }
}

function formatDuration(minutes?: number): string | null {
  if (!minutes || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours && mins) return `${hours}ч ${mins}м`;
  if (hours) return `${hours}ч`;
  return `${mins}м`;
}

function resolveOfferCurrency(code: string): CurrencyCode {
  const normalized = code.trim().toUpperCase();
  const allowed: CurrencyCode[] = ["RUB", "USD", "EUR", "ARS", "BRL", "CLP", "UYU", "GBP", "CAD", "AUD", "CHF"];
  return allowed.includes(normalized as CurrencyCode) ? (normalized as CurrencyCode) : "USD";
}

export default function FlightOfferCard({ offer, locale, routeKey, labels }: FlightOfferCardProps) {
  const duration = formatDuration(offer.durationMinutes);
  const priceLabel = formatCurrencyAmount(
    Math.round(offer.price),
    resolveOfferCurrency(offer.currency),
    locale
  );
  const bookHref = offer.ticketPath
    ? `/api/affiliate/flights/book?${new URLSearchParams({
        ticket: offer.ticketPath,
        route: routeKey,
        locale,
      })}`
    : null;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-shadow hover:shadow-elevated sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm text-slate">
          <Plane className="h-4 w-4 shrink-0 text-sky" />
          <span>
            {offer.origin} → {offer.destination}
          </span>
          {offer.airline ? <span>· {offer.airline}</span> : null}
          {offer.flightNumber ? <span>{offer.flightNumber}</span> : null}
        </div>

        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate">{labels.departure}</p>
            <p className="font-medium text-charcoal">{formatFlightDate(offer.departureAt, locale)}</p>
          </div>
          {offer.returnAt ? (
            <div>
              <p className="text-xs uppercase tracking-wide text-slate">{labels.return}</p>
              <p className="font-medium text-charcoal">{formatFlightDate(offer.returnAt, locale)}</p>
            </div>
          ) : null}
        </div>

        <p className="mt-2 text-sm text-slate">
          {offer.transfers === 0
            ? labels.direct
            : labels.stops.replace("{count}", String(offer.transfers))}
          {duration ? ` · ${duration}` : ""}
        </p>
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
