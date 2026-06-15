"use client";

import { ArrowUpRight, CalendarDays, Database, Signal, Wifi } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { convertToUsd } from "@/lib/currency";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { cn } from "@/lib/utils";
import type { EsimOffer } from "@/lib/airalo/types";
import type { CurrencyCode, LocaleCode } from "@/types/locale";

type EsimOfferCardProps = {
  offer: EsimOffer;
  countryId: string;
  locale: LocaleCode;
  labels: {
    buy: string;
    buyHint: string;
    from: string;
    data: string;
    validity: string;
    network: string;
    pricePerDay: string;
    planType: string;
    inStock: string;
    unlimited: string;
    days: string;
  };
};

function resolveCurrency(code: string): CurrencyCode {
  const normalized = code.trim().toUpperCase();
  const allowed: CurrencyCode[] = ["RUB", "USD", "EUR", "ARS", "BRL", "CLP", "UYU", "GBP", "CAD", "AUD", "CHF"];
  return allowed.includes(normalized as CurrencyCode) ? (normalized as CurrencyCode) : "USD";
}

function resolvePriceUsd(amount: number, sourceCurrency: CurrencyCode): number {
  if (sourceCurrency === "USD") return amount;
  return convertToUsd(amount, sourceCurrency);
}

function buildDisplayTitle(offer: EsimOffer, labels: EsimOfferCardProps["labels"]): string {
  const parts: string[] = [];
  if (offer.networkLabel) parts.push(offer.networkLabel);
  if (offer.isUnlimited) parts.push(labels.unlimited);
  else if (offer.dataLabel) parts.push(offer.dataLabel);
  if (offer.validityDays) parts.push(`${offer.validityDays} ${labels.days}`);
  if (parts.length) return parts.join(" · ");
  return offer.title;
}

export default function EsimOfferCard({ offer, countryId, locale, labels }: EsimOfferCardProps) {
  const { formatPrice } = useLocaleCurrency();
  const sourceCurrency = resolveCurrency(offer.currency);
  const displayPriceUsd = resolvePriceUsd(offer.salePrice ?? offer.price, sourceCurrency);
  const priceLabel = formatPrice(displayPriceUsd);
  const originalPrice =
    offer.salePrice != null && offer.salePrice < offer.price
      ? formatPrice(resolvePriceUsd(offer.price, sourceCurrency))
      : null;
  const pricePerDayLabel =
    offer.pricePerDay != null
      ? formatPrice(resolvePriceUsd(offer.pricePerDay, sourceCurrency))
      : null;

  const bookHref = `/api/affiliate/esim/book?${new URLSearchParams({
    offerId: offer.id,
    country: countryId,
    locale,
  })}`;

  const displayTitle = buildDisplayTitle(offer, labels);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-shadow hover:shadow-elevated">
      <div className="relative aspect-[16/10] bg-gradient-to-br from-sky/5 via-white to-surface-muted">
        {offer.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={offer.imageUrl}
            alt=""
            className="h-full w-full object-contain p-4"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sky">
            <Wifi className="h-10 w-10" aria-hidden />
          </div>
        )}
        {offer.inStock === false ? (
          <span className="absolute left-3 top-3 rounded-full bg-charcoal/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            Out of stock
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap gap-2">
          {offer.isUnlimited ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky/10 px-2.5 py-1 text-xs font-medium text-sky">
              <Database className="h-3 w-3" aria-hidden />
              {labels.unlimited}
            </span>
          ) : offer.dataLabel ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky/10 px-2.5 py-1 text-xs font-medium text-sky">
              <Database className="h-3 w-3" aria-hidden />
              {offer.dataLabel}
            </span>
          ) : null}
          {offer.validityDays ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-charcoal/5 px-2.5 py-1 text-xs font-medium text-charcoal">
              <CalendarDays className="h-3 w-3" aria-hidden />
              {offer.validityDays} {labels.days}
            </span>
          ) : null}
        </div>

        <h3 className="mt-3 line-clamp-2 font-heading text-lg font-bold leading-snug text-charcoal">
          {displayTitle}
        </h3>

        <dl className="mt-3 space-y-2 text-sm">
          {offer.networkLabel ? (
            <div className="flex items-start justify-between gap-3">
              <dt className="inline-flex items-center gap-1.5 text-slate">
                <Signal className="h-3.5 w-3.5" aria-hidden />
                {labels.network}
              </dt>
              <dd className="font-medium text-charcoal">{offer.networkLabel}</dd>
            </div>
          ) : null}
          {offer.planType ? (
            <div className="flex items-start justify-between gap-3">
              <dt className="text-slate">{labels.planType}</dt>
              <dd className="font-medium text-charcoal">{offer.planType}</dd>
            </div>
          ) : null}
          {offer.region ? (
            <div className="flex items-start justify-between gap-3">
              <dt className="text-slate">{labels.data}</dt>
              <dd className="text-right font-medium text-charcoal">{offer.region}</dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-auto border-t border-gray-100 pt-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              {originalPrice ? (
                <p className="text-sm text-slate line-through">{originalPrice}</p>
              ) : null}
              <p className="font-heading text-2xl font-bold text-charcoal">
                {labels.from.replace("{price}", priceLabel)}
              </p>
              {pricePerDayLabel ? (
                <p className="mt-0.5 text-xs text-slate">
                  {labels.pricePerDay.replace("{price}", pricePerDayLabel)}
                </p>
              ) : null}
            </div>
            <div className="text-right">
              <a
                href={bookHref}
                className={cn(buttonVariants({ variant: "default", size: "sm" }), "rounded-full px-4")}
              >
                {labels.buy}
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </a>
              <p className="mt-1 max-w-[9rem] text-[10px] leading-snug text-slate">{labels.buyHint}</p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
