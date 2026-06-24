"use client";

import { useEffect, useState } from "react";
import { Check, Clock3, Flag, MapPin } from "lucide-react";
import type { PartnerTourContent } from "@/lib/tripster/partner-tour-content";
import { cn } from "@/lib/cn";
import {
  dateFitsGuestCount,
  validateGuestsForScheduledBooking,
} from "@/lib/tour-booking-spots";
import { formatDateRange } from "@/lib/utils";
import {
  formatYouTravelArrivalDisplayDate,
  normalizeYouTravelArrivalCityLabel,
  parseYouTravelArrivalDateTime,
} from "@/lib/youtravel/partner-tour-locations";
import type { TourDatePrice, TourDetail } from "@/types";
import { useTourBooking } from "./TourBookingContext";
import TourSection from "./TourSection";

type ArrivalRole = "start" | "finish";

type ArrivalPoint = {
  role: ArrivalRole;
  label: string;
  date?: string;
  time?: string;
  city?: string;
};

const ROLE_STYLES: Record<
  ArrivalRole,
  {
    card: string;
    iconWrap: string;
    icon: string;
    badge: string;
  }
> = {
  start: {
    card: "bg-gradient-to-br from-success/[0.08] to-white",
    iconWrap: "bg-success/12 text-success",
    icon: "text-success",
    badge: "bg-success/10 text-success",
  },
  finish: {
    card: "bg-gradient-to-br from-charcoal/[0.06] to-white",
    iconWrap: "bg-charcoal/10 text-charcoal",
    icon: "text-charcoal",
    badge: "bg-charcoal/10 text-charcoal",
  },
};

function resolveReferenceDate(
  scheduleDates: TourDatePrice[],
  selectedDateId: string,
  fallbackDates: TourDatePrice[],
): TourDatePrice | undefined {
  const dates = scheduleDates.filter((item) => item.startDate);
  if (selectedDateId) {
    const selected = dates.find((date) => date.id === selectedDateId);
    if (selected) return selected;
  }
  if (dates.length === 1) return dates[0];
  return dates[0] ?? fallbackDates[0];
}

function resolveArrivalPoint(
  referenceDate: TourDatePrice | undefined,
  content: PartnerTourContent,
  role: ArrivalRole,
  allowScrapedDateFallback: boolean,
): ArrivalPoint | null {
  const info = content.arrivalInfo;
  if (!info) return null;

  const label =
    role === "start"
      ? info.startLabel?.trim() || "Старт"
      : info.finishLabel?.trim() || "Финиш";
  const cityRaw =
    role === "start" ? info.startCity?.trim() : info.finishCity?.trim();
  const city = cityRaw ? normalizeYouTravelArrivalCityLabel(cityRaw) : undefined;
  const scrapedDate =
    role === "start" ? info.startDate?.trim() : info.finishDate?.trim();
  const timePart =
    role === "start" ? info.startTime?.trim() : info.finishTime?.trim();
  const parsedScraped = parseYouTravelArrivalDateTime(scrapedDate);
  const effectiveTime = timePart || parsedScraped.timePart;

  const isoDate =
    role === "start"
      ? referenceDate?.startDate
      : referenceDate?.endDate || referenceDate?.startDate;

  const dateFromOffers = isoDate
    ? formatYouTravelArrivalDisplayDate(isoDate, effectiveTime)
    : undefined;

  const date =
    dateFromOffers ||
    (allowScrapedDateFallback && effectiveTime && (parsedScraped.datePart ?? scrapedDate)
      ? `${parsedScraped.datePart ?? scrapedDate}, ${effectiveTime} (местное время)`
      : allowScrapedDateFallback
        ? scrapedDate
        : undefined);
  if (!date && !city && !effectiveTime) return null;

  return { role, label, date, time: effectiveTime, city };
}

function ArrivalDatePicker({
  tour,
  dates,
  selectedDateId,
  guests,
  onSelect,
}: {
  tour: TourDetail;
  dates: TourDatePrice[];
  selectedDateId: string;
  guests: number;
  onSelect: (dateId: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [guests, selectedDateId]);

  function handleSelect(date: TourDatePrice) {
    const selectionError = validateGuestsForScheduledBooking(
      { ...tour, dates },
      guests,
      date.id,
    );
    if (selectionError) {
      setError(selectionError);
      return;
    }
    setError(null);
    onSelect(date.id);
  }

  return (
    <div className="mb-5 space-y-2.5">
      <p className="text-sm leading-relaxed text-slate">
        Есть несколько дат заезда — выберите нужную. Обновятся старт и финиш, блок бронирования и
        поиск авиабилетов ниже.
      </p>
      <div
        className="flex flex-wrap gap-2"
        role="radiogroup"
        aria-label="Даты заезда тура"
      >
        {dates.map((date) => {
          const selected = date.id === selectedDateId;
          const bookable = dateFitsGuestCount(date, guests, tour.groupMin);

          return (
            <button
              key={date.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!bookable}
              onClick={() => handleSelect(date)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                selected
                  ? "border-sky bg-sky/10 text-sky-dark ring-2 ring-sky/20"
                  : bookable
                    ? "border-gray-200 bg-white text-charcoal hover:border-sky/40 hover:bg-sky/[0.04]"
                    : "cursor-not-allowed border-gray-100 bg-gray-50 text-slate/70 opacity-70",
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                  selected ? "border-sky bg-sky text-white" : "border-gray-300 bg-white",
                )}
                aria-hidden
              >
                {selected ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
              </span>
              {formatDateRange(date.startDate, date.endDate)}
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="rounded-xl border border-wine/15 bg-wine/5 px-3 py-2 text-sm text-wine">
          {error}
        </p>
      ) : null}
      {!selectedDateId ? (
        <p className="text-xs text-amber-800">Выберите дату заезда, чтобы увидеть точные даты старта и финиша.</p>
      ) : null}
    </div>
  );
}

function ArrivalPointCard({
  point,
  pendingDateSelection,
}: {
  point: ArrivalPoint;
  pendingDateSelection?: boolean;
}) {
  const styles = ROLE_STYLES[point.role];
  const parsed = parseYouTravelArrivalDateTime(point.date);
  const dateLabel = pendingDateSelection
    ? "Выберите дату заезда"
    : (parsed.datePart ?? point.date);
  const timeLabel = parsed.timePart ?? point.time;

  return (
    <article
      className={cn(
        "relative flex min-h-full flex-col rounded-2xl border border-gray-100 p-5 sm:p-6",
        styles.card,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            styles.iconWrap,
          )}
        >
          <Flag
            className={cn("h-[18px] w-[18px] stroke-[1.75]", point.role === "finish" && "rotate-180")}
            aria-hidden
          />
        </span>
        <div className="min-w-0 flex-1">
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
              styles.badge,
            )}
          >
            {point.label}
          </span>
          {dateLabel ? (
            <p
              className={cn(
                "mt-2 text-lg font-semibold leading-snug sm:text-xl",
                pendingDateSelection ? "text-slate/70" : "text-charcoal",
              )}
            >
              {dateLabel}
            </p>
          ) : null}
          {timeLabel ? (
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-slate">
              <Clock3 className={cn("h-3.5 w-3.5 shrink-0", styles.icon)} aria-hidden />
              <span>
                {timeLabel}
                <span className="text-slate/80"> · местное время</span>
              </span>
            </p>
          ) : null}
          {point.city ? (
            <p className="mt-3 inline-flex items-start gap-1.5 text-sm font-medium text-charcoal/85">
              <MapPin className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", styles.icon)} aria-hidden />
              <span>{point.city}</span>
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function PartnerTourArrivalInfoSection({
  tour,
  content,
}: {
  tour: TourDetail;
  content: PartnerTourContent;
}) {
  const {
    selectedDateId,
    setSelectedDateId,
    setDateMode,
    scheduleDates,
    guests,
  } = useTourBooking();
  const dates = scheduleDates.filter((item) => item.startDate);
  const hasMultipleDates = dates.length > 1;
  const allowScrapedDateFallback = !hasMultipleDates || Boolean(selectedDateId);

  useEffect(() => {
    if (dates.length !== 1 || selectedDateId) return;
    setDateMode("scheduled");
    setSelectedDateId(dates[0]!.id);
  }, [dates, selectedDateId, setSelectedDateId, setDateMode]);

  const referenceDate = hasMultipleDates
    ? dates.find((date) => date.id === selectedDateId)
    : resolveReferenceDate(scheduleDates, selectedDateId, tour.dates);
  const pendingDateSelection = hasMultipleDates && !selectedDateId;

  const points = (
    [
      resolveArrivalPoint(referenceDate, content, "start", allowScrapedDateFallback),
      resolveArrivalPoint(referenceDate, content, "finish", allowScrapedDateFallback),
    ] as const
  ).filter((point): point is ArrivalPoint => point != null);

  if (!points.length) return null;

  function handleDateSelect(dateId: string) {
    setDateMode("scheduled");
    setSelectedDateId(dateId);
  }

  return (
    <TourSection id="arrival-info" title="Информация по прибытию">
      {hasMultipleDates ? (
        <ArrivalDatePicker
          tour={tour}
          dates={dates}
          selectedDateId={selectedDateId}
          guests={guests}
          onSelect={handleDateSelect}
        />
      ) : null}
      <div className="relative">
        {points.length === 2 ? (
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 sm:block"
            aria-hidden
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-white text-sky shadow-card">
              <span className="block h-1.5 w-1.5 rounded-full bg-sky" />
            </span>
          </div>
        ) : null}
        <div
          className={cn(
            "grid gap-4",
            points.length === 2 ? "sm:grid-cols-2 sm:gap-5" : "max-w-xl",
          )}
        >
          {points.map((point) => (
            <ArrivalPointCard
              key={point.role}
              point={point}
              pendingDateSelection={pendingDateSelection}
            />
          ))}
        </div>
      </div>
    </TourSection>
  );
}
