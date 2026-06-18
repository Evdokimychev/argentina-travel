import type { TourDatePrice } from "@/types";
import {
  eachDayOfInterval,
  format,
  isAfter,
  isBefore,
  isValid,
  parseISO,
  startOfDay,
} from "date-fns";
import { computeEndDateFromStart } from "@/data/tour-booking-defaults";

export interface TourDatePriceSummary {
  minPriceUsd: number;
  maxPriceUsd: number;
  hasVariedPrices: boolean;
  /** Минимальная цена для подписи «от …» в каталоге и шапке. */
  catalogPriceUsd: number;
  departureCount: number;
}

export interface DepartureCalendarEntry {
  date: TourDatePrice;
  startKey: string;
}

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatCompactUsd(priceUsd: number): string {
  if (priceUsd <= 0) return "—";
  return usdCompact.format(priceUsd).replace(/\.00$/, "");
}

export function resolveTourDatePriceSummary(
  dates: Array<Pick<TourDatePrice, "priceUsd">>,
  fallbackPriceUsd = 0
): TourDatePriceSummary {
  const prices = dates.map((item) => item.priceUsd).filter((value) => value > 0);
  if (!prices.length) {
    return {
      minPriceUsd: fallbackPriceUsd,
      maxPriceUsd: fallbackPriceUsd,
      hasVariedPrices: false,
      catalogPriceUsd: fallbackPriceUsd,
      departureCount: dates.length,
    };
  }

  const minPriceUsd = Math.min(...prices);
  const maxPriceUsd = Math.max(...prices);

  return {
    minPriceUsd,
    maxPriceUsd,
    hasVariedPrices: minPriceUsd !== maxPriceUsd,
    catalogPriceUsd: minPriceUsd,
    departureCount: dates.length,
  };
}

export function buildDepartureCalendarMap(dates: TourDatePrice[]): Map<string, DepartureCalendarEntry> {
  const map = new Map<string, DepartureCalendarEntry>();
  for (const date of dates) {
    if (!date.startDate) continue;
    map.set(date.startDate, { date, startKey: date.startDate });
  }
  return map;
}

export function resolveTourDepartureEndDate(
  startDate: string,
  endDate?: string,
  durationDays?: number
): string {
  if (endDate?.trim()) return endDate;
  if (durationDays != null && durationDays > 0) {
    return computeEndDateFromStart(startDate, durationDays) || startDate;
  }
  return startDate;
}

export function eachTourDepartureDateKey(
  startDate: string,
  endDate?: string,
  durationDays?: number
): string[] {
  const start = parseISO(startDate);
  const end = parseISO(resolveTourDepartureEndDate(startDate, endDate, durationDays));
  if (!isValid(start) || !isValid(end)) return startDate ? [startDate] : [];

  const from = isBefore(start, end) ? startOfDay(start) : startOfDay(end);
  const to = isAfter(start, end) ? startOfDay(start) : startOfDay(end);

  return eachDayOfInterval({ start: from, end: to }).map((day) => format(day, "yyyy-MM-dd"));
}

export function countTourDepartureDays(
  startDate: string,
  endDate?: string,
  durationDays?: number
): number {
  return eachTourDepartureDateKey(startDate, endDate, durationDays).length;
}

export function countTourDepartureNights(
  startDate: string,
  endDate?: string,
  durationDays?: number
): number {
  return Math.max(countTourDepartureDays(startDate, endDate, durationDays) - 1, 0);
}

export function resolveTourCatalogPriceUsd(
  dates: TourDatePrice[],
  basePriceUsd: number
): { priceUsd: number; priceFromPrefix: boolean } {
  const summary = resolveTourDatePriceSummary(dates, basePriceUsd);
  if (!summary.departureCount || summary.minPriceUsd <= 0) {
    return { priceUsd: basePriceUsd, priceFromPrefix: false };
  }
  return {
    priceUsd: summary.catalogPriceUsd,
    priceFromPrefix: summary.hasVariedPrices,
  };
}

export function formatDatePriceRangeLabel(
  summary: TourDatePriceSummary,
  priceOnRequest?: boolean
): string | null {
  if (priceOnRequest || !summary.hasVariedPrices) return null;
  return `${formatCompactUsd(summary.minPriceUsd)} – ${formatCompactUsd(summary.maxPriceUsd)} за туриста`;
}
