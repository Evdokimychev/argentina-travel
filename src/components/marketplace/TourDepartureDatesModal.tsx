"use client";

import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { useMemo } from "react";
import type { TourDate, TourListing } from "@/types";
import FormattedPrice from "@/components/FormattedPrice";
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog";
import { DialogPanelHeader } from "@/components/ui/dialog-panel-header";
import { SafeImage } from "@/components/ui/safe-image";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatDays, formatNights } from "@/lib/pluralize";
import {
  formatDepartureRangeCompact,
  formatMonthName,
} from "@/lib/utils";
import { TOUR_PRICE_ON_REQUEST_LABEL } from "@/lib/tour-price-public";

interface TourDepartureDatesModalProps {
  tour: TourListing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function groupDatesByYear(dates: TourDate[]): { year: number; dates: TourDate[] }[] {
  const groups = new Map<number, TourDate[]>();

  for (const date of dates) {
    const year = new Date(`${date.start}T12:00:00`).getFullYear();
    const bucket = groups.get(year) ?? [];
    bucket.push(date);
    groups.set(year, bucket);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, yearDates]) => ({ year, dates: yearDates }));
}

function DepartureDateRow({
  date,
  durationDays,
  durationNights,
  priceOnRequest,
  priceUsd,
}: {
  date: TourDate;
  durationDays: number;
  durationNights: number;
  priceOnRequest?: boolean;
  priceUsd: number;
}) {
  return (
    <li
      className={cn(
        "grid items-start gap-4 border-b border-gray-100 py-4 last:border-b-0",
        priceOnRequest
          ? "grid-cols-[minmax(4.5rem,5.5rem)_1fr]"
          : "grid-cols-[minmax(4.5rem,5.5rem)_1fr_auto]"
      )}
    >
      <p className="pt-0.5 text-sm font-bold text-charcoal">{formatMonthName(date.start)}</p>

      <div className="min-w-0">
        <p className="text-sm font-bold leading-snug text-charcoal">
          {formatDepartureRangeCompact(date.start, date.end)}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate">
          <span className="inline-flex items-center gap-1">
            <Sun className="h-3.5 w-3.5 text-sun" aria-hidden />
            {formatDays(durationDays)}
          </span>
          {durationNights > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Moon className="h-3.5 w-3.5 text-sky" aria-hidden />
              {formatNights(durationNights)}
            </span>
          ) : null}
        </div>
      </div>

      {!priceOnRequest ? (
        <p className="pt-0.5 text-right text-sm font-bold tabular-nums text-charcoal">
          <FormattedPrice priceUsd={priceUsd} className="inline text-sm font-bold" />
        </p>
      ) : null}
    </li>
  );
}

export default function TourDepartureDatesModal({
  tour,
  open,
  onOpenChange,
}: TourDepartureDatesModalProps) {
  const dateGroups = useMemo(() => groupDatesByYear(tour.availableDates), [tour.availableDates]);
  const currentYear = new Date().getFullYear();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose={false} className="max-w-xl gap-0 overflow-hidden p-0 sm:max-w-xl sm:rounded-3xl">
        <DialogDescription className="sr-only">Даты заезда тура {tour.title}</DialogDescription>
        <DialogPanelHeader
          onClose={() => onOpenChange(false)}
          title="Варианты заезда"
        />

        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
              <SafeImage
                src={tour.image}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 font-heading text-base font-bold leading-snug text-charcoal">
                {tour.title}
              </p>
              {tour.priceOnRequest ? (
                <p className="mt-1 text-sm font-medium text-charcoal">{TOUR_PRICE_ON_REQUEST_LABEL}</p>
              ) : (
                <p className="mt-1 text-sm text-slate">
                  <FormattedPrice priceUsd={tour.priceUsd} className="inline font-semibold text-charcoal" />{" "}
                  за туриста
                </p>
              )}
            </div>

            <Link
              href={`/tours/${tour.slug}`}
              className={cn(
                buttonVariants({ size: "sm" }),
                "shrink-0 rounded-xl px-4 font-semibold"
              )}
              onClick={() => onOpenChange(false)}
            >
              Смотреть
            </Link>
          </div>
        </div>

        <div className="max-h-[min(52vh,28rem)] overflow-y-auto px-6 py-2">
          {dateGroups.map(({ year, dates }) => (
            <section key={year} className="py-3">
              <h3 className="text-xs font-medium text-slate">
                {year === currentYear
                  ? "Групповые даты в этом году"
                  : `Групповые даты в ${year} году`}
              </h3>
              <ul className="mt-1">
                {dates.map((date) => (
                  <DepartureDateRow
                    key={`${date.start}-${date.end}`}
                    date={date}
                    durationDays={tour.durationDays}
                    durationNights={tour.durationNights}
                    priceOnRequest={tour.priceOnRequest}
                    priceUsd={tour.priceUsd}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
