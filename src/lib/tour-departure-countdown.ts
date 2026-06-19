import { startOfDay } from "date-fns";
import type { TourDatePrice } from "@/types";
import { dateFitsGuestCount } from "@/lib/tour-booking-spots";
import type { LocaleCode } from "@/types/locale";
import { formatSpots, formatTouristsRange } from "@/lib/pluralize";

/** Departure moment — morning of the start date (Argentina, UTC−3). */
export function getDepartureDateTime(startDate: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return new Date(`${startDate}T08:00:00-03:00`);
  }
  const parsed = new Date(startDate);
  parsed.setHours(8, 0, 0, 0);
  return parsed;
}

export interface CountdownParts {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

export function computeCountdownParts(target: Date, now: Date = new Date()): CountdownParts {
  const totalMs = Math.max(0, target.getTime() - now.getTime());
  const expired = totalMs <= 0;

  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { totalMs, days, hours, minutes, seconds, expired };
}

export function findNextUpcomingDeparture(
  dates: TourDatePrice[],
  options?: {
    guests?: number;
    groupMin?: number;
    now?: Date;
  }
): TourDatePrice | null {
  if (!dates.length) return null;

  const now = options?.now ?? new Date();
  const guests = options?.guests ?? 1;
  const groupMin = options?.groupMin ?? 1;

  const upcoming = [...dates]
    .filter((date) => getDepartureDateTime(date.startDate) > now)
    .sort(
      (a, b) =>
        getDepartureDateTime(a.startDate).getTime() - getDepartureDateTime(b.startDate).getTime()
    );

  if (!upcoming.length) return null;

  const bookable = upcoming.filter((date) => dateFitsGuestCount(date, guests, groupMin));
  return bookable[0] ?? upcoming[0];
}

const LOCALE_BCP47: Record<LocaleCode, string> = {
  ru: "ru-RU",
  en: "en-US",
  es: "es-AR",
  pt: "pt-BR",
};

export function formatDepartureDateLabel(startDate: string, locale: LocaleCode): string {
  const date = getDepartureDateTime(startDate);
  return new Intl.DateTimeFormat(LOCALE_BCP47[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatSpotsRemainingPhrase(count: number, locale: LocaleCode): string {
  if (locale === "ru") {
    return `Осталось ${formatSpots(count)}`;
  }

  if (locale === "es") {
    const word = count === 1 ? "plaza" : "plazas";
    return `Quedan ${count} ${word}`;
  }

  if (locale === "pt") {
    const word = count === 1 ? "vaga" : "vagas";
    return `Restam ${count} ${word}`;
  }

  const word = count === 1 ? "spot" : "spots";
  return `${count} ${word} left`;
}

export function formatGroupSizeRange(min: number, max: number, locale: LocaleCode): string {
  if (locale === "ru") return formatTouristsRange(min, max);
  if (locale === "es") return `${min}–${max} viajeros`;
  if (locale === "pt") return `${min}–${max} viajantes`;
  return `${min}–${max} travelers`;
}

export function isDepartureSoon(parts: CountdownParts): boolean {
  return !parts.expired && parts.totalMs <= 7 * 24 * 60 * 60 * 1000;
}

export function isLowAvailability(spotsLeft: number): boolean {
  return spotsLeft > 0 && spotsLeft <= 3;
}

/** Days until departure (calendar days, for urgency badges). */
export function daysUntilDeparture(startDate: string, now: Date = new Date()): number {
  const target = startOfDay(getDepartureDateTime(startDate));
  const today = startOfDay(now);
  return Math.max(0, Math.round((target.getTime() - today.getTime()) / 86400000));
}
