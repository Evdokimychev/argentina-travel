"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Flame, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import {
  computeCountdownParts,
  findNextUpcomingDeparture,
  formatDepartureDateLabel,
  formatGroupSizeRange,
  formatSpotsRemainingPhrase,
  getDepartureDateTime,
  isDepartureSoon,
  isLowAvailability,
} from "@/lib/tour-departure-countdown";
import { dateFitsGuestCount } from "@/lib/tour-booking-spots";
import { useTourBooking } from "./TourBookingContext";
import type { TourDetail } from "@/types";
import { isWaitlistFeatureEnabled } from "@/lib/tour-waitlist";

interface TourDepartureCountdownProps {
  tour: Pick<TourDetail, "dates" | "groupMin" | "groupMax" | "waitlistEnabled">;
  className?: string;
}

function padUnit(value: number): string {
  return String(value).padStart(2, "0");
}

function CountdownUnit({
  value,
  label,
  urgent,
}: {
  value: number;
  label: string;
  urgent?: boolean;
}) {
  return (
    <div className="flex min-w-[3.25rem] flex-col items-center">
      <span
        className={cn(
          "flex h-11 w-full items-center justify-center rounded-xl border text-lg font-bold tabular-nums sm:h-12 sm:text-xl",
          urgent
            ? "border-wine/25 bg-wine/10 text-wine"
            : "border-sky/20 bg-white text-charcoal shadow-sm"
        )}
      >
        {padUnit(value)}
      </span>
      <span className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-slate sm:text-xs">
        {label}
      </span>
    </div>
  );
}

export default function TourDepartureCountdown({ tour, className }: TourDepartureCountdownProps) {
  const { t, locale } = useLocaleCurrency();
  const { guests, setSelectedDateId, openCheckout, openWaitlist, canJoinWaitlist } =
    useTourBooking();
  const [now, setNow] = useState(() => new Date());

  const nextDeparture = useMemo(
    () =>
      findNextUpcomingDeparture(tour.dates, {
        guests,
        groupMin: tour.groupMin,
        now,
      }),
    [tour.dates, guests, tour.groupMin, now]
  );

  useEffect(() => {
    if (!nextDeparture) return;
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [nextDeparture]);

  if (!nextDeparture) return null;

  const departureAt = getDepartureDateTime(nextDeparture.startDate);
  const countdown = computeCountdownParts(departureAt, now);
  const bookable = dateFitsGuestCount(nextDeparture, guests, tour.groupMin);
  const lowSpots = isLowAvailability(nextDeparture.spotsLeft);
  const soon = isDepartureSoon(countdown);
  const urgent = lowSpots || soon;

  const spotsPhrase = formatSpotsRemainingPhrase(nextDeparture.spotsLeft, locale);
  const departureLabel = formatDepartureDateLabel(nextDeparture.startDate, locale);
  const groupLabel = formatGroupSizeRange(tour.groupMin, tour.groupMax, locale);

  function handleAction() {
    setSelectedDateId(nextDeparture!.id);
    if (bookable) {
      openCheckout();
      return;
    }
    if (isWaitlistFeatureEnabled(tour) && canJoinWaitlist) {
      openWaitlist();
    }
  }

  const ctaLabel = bookable
    ? t("tour.countdown.ctaBook")
    : isWaitlistFeatureEnabled(tour)
      ? t("tour.countdown.ctaWaitlist")
      : t("tour.countdown.ctaSelect");

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border shadow-sm",
        urgent ? "border-wine/20 bg-gradient-to-br from-wine/[0.06] via-white to-amber-50/40" : "border-sky/15 bg-gradient-to-br from-sky/[0.07] via-white to-surface-muted/30",
        className
      )}
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sky-dark">
              <CalendarClock className="h-4 w-4 shrink-0" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-wider">
                {t("tour.countdown.title")}
              </p>
            </div>
            <p className="mt-2 font-heading text-base font-bold text-charcoal sm:text-lg">
              {t("tour.countdown.departureOn").replace("{date}", departureLabel)}
            </p>
          </div>
          {lowSpots ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-wine/10 px-2.5 py-1 text-xs font-semibold text-wine">
              <Flame className="h-3.5 w-3.5" aria-hidden />
              {t("tour.countdown.badgeHot")}
            </span>
          ) : null}
        </div>

        {!countdown.expired ? (
          <div
            className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start sm:gap-3"
            role="timer"
            aria-live="polite"
            aria-label={t("tour.countdown.title")}
          >
            <CountdownUnit value={countdown.days} label={t("tour.countdown.days")} urgent={urgent} />
            <CountdownUnit value={countdown.hours} label={t("tour.countdown.hours")} urgent={urgent} />
            <CountdownUnit
              value={countdown.minutes}
              label={t("tour.countdown.minutes")}
              urgent={urgent}
            />
            <CountdownUnit
              value={countdown.seconds}
              label={t("tour.countdown.seconds")}
              urgent={urgent}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm font-medium text-charcoal">{t("tour.countdown.started")}</p>
        )}

        <div className="mt-4 space-y-2">
          <p
            className={cn(
              "text-sm font-medium",
              lowSpots ? "text-wine" : "text-charcoal"
            )}
          >
            {lowSpots
              ? t("tour.countdown.spotsUrgent").replace("{spots}", spotsPhrase)
              : t("tour.countdown.spotsCalm").replace("{spots}", spotsPhrase)}
          </p>
          <p className="flex items-start gap-2 text-sm text-slate">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-sky/80" aria-hidden />
            <span>{t("tour.countdown.joinGroup").replace("{group}", groupLabel)}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleAction}
          className={cn(
            "mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
            urgent
              ? "bg-wine text-white hover:bg-wine/90"
              : "bg-sky text-white hover:bg-sky-dark"
          )}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
