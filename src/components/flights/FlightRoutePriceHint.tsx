"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Loader2, Plane } from "lucide-react";
import type { FlightPriceOffer } from "@/lib/travelpayouts/aviasales/types";
import {
  buildTeaserBookHref,
  formatTeaserDate,
  formatTeaserPrice,
} from "@/lib/flights/teaser-format";
import { buildFlightsSearchHref } from "@/lib/flights/search-href";
import { getFlightTeaserLabels } from "@/lib/flights/teaser-labels";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LocaleCode } from "@/types/locale";

type FlightRoutePriceHintProps = {
  origin: string;
  destination: string;
  originLabel: string;
  destinationLabel: string;
  routeId: string;
  locale?: LocaleCode;
  className?: string;
};

export default function FlightRoutePriceHint({
  origin,
  destination,
  originLabel,
  destinationLabel,
  routeId,
  locale = "ru",
  className,
}: FlightRoutePriceHintProps) {
  const labels = useMemo(() => getFlightTeaserLabels(locale), [locale]);
  const [teaser, setTeaser] = useState<{
    price: number;
    currency: string;
    departureAt: string;
    ticketPath?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setTeaser(null);

    const params = new URLSearchParams({ origin, destination, locale });
    void fetch(`/api/flights/prices?${params}`)
      .then((response) => response.json())
      .then((payload: { offers?: FlightPriceOffer[]; source?: string }) => {
        if (cancelled) return;
        const offer = payload.offers?.[0];
        if (!offer) {
          setFailed(true);
          return;
        }
        setTeaser({
          price: offer.price,
          currency: offer.currency,
          departureAt: offer.departureAt,
          ticketPath: offer.ticketPath,
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [origin, destination, locale]);

  const searchHref = buildFlightsSearchHref(origin, destination);
  const dateLabel = teaser ? formatTeaserDate(teaser.departureAt) : null;

  return (
    <div className={cn("border-t border-gray-100 bg-sky/[0.04] px-4 py-4", className)}>
      <div className="flex items-start gap-3">
        <Plane className="mt-0.5 h-5 w-5 shrink-0 text-sky" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-charcoal">
            {originLabel} → {destinationLabel}
          </p>
          {loading ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-slate">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {labels.loading}
            </p>
          ) : teaser ? (
            <>
              <p className="mt-1 font-heading text-2xl font-bold text-charcoal">
                {formatTeaserPrice(
                  {
                    routeId,
                    origin,
                    destination,
                    originLabel,
                    destinationLabel,
                    price: teaser.price,
                    currency: teaser.currency,
                    departureAt: teaser.departureAt,
                    ticketPath: teaser.ticketPath,
                  },
                  locale
                )}
              </p>
              <p className="mt-1 text-xs text-slate">
                {dateLabel
                  ? `${labels.fromDate} ${dateLabel} · Aviasales`
                  : labels.aviasalesNote}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate">
              {failed ? labels.unavailable : labels.checkRoute}
            </p>
          )}
        </div>
        {!loading ? (
          <Link
            href={
              teaser
                ? buildTeaserBookHref(
                    {
                      routeId,
                      origin,
                      destination,
                      originLabel,
                      destinationLabel,
                      price: teaser.price,
                      currency: teaser.currency,
                      departureAt: teaser.departureAt,
                      ticketPath: teaser.ticketPath,
                    },
                    locale
                  )
                : searchHref
            }
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "shrink-0 rounded-full px-4")}
          >
            {labels.ticketsCta}
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
