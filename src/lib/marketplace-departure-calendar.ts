import { format, isValid, parseISO, startOfDay } from "date-fns";
import type { TourDate, TourListing } from "@/types";
import { isTripsterPartnerListing } from "@/lib/tripster/partner-tour-utils";

export type MarketplaceDepartureItem = {
  tourId: string;
  tourSlug: string;
  tourTitle: string;
  tourImage: string;
  destination: string;
  durationDays: number;
  durationNights: number;
  priceUsd: number;
  priceOnRequest?: boolean;
  partnerSource?: TourListing["partnerSource"];
  startDate: string;
  endDate: string;
  spotsLeft: number;
};

export type MarketplaceDepartureIndex = {
  byStartDate: Map<string, MarketplaceDepartureItem[]>;
  totalDepartures: number;
  tourCountWithDates: number;
  tripsterWithoutDates: number;
  earliestDate: string | null;
  latestDate: string | null;
};

function isFutureOrTodayDateKey(dateKey: string, today = startOfDay(new Date())): boolean {
  const parsed = parseISO(dateKey);
  if (!isValid(parsed)) return false;
  return startOfDay(parsed) >= today;
}

function listingDateToItem(tour: TourListing, date: TourDate): MarketplaceDepartureItem {
  return {
    tourId: tour.id,
    tourSlug: tour.slug,
    tourTitle: tour.title,
    tourImage: tour.image,
    destination: tour.destination,
    durationDays: tour.durationDays,
    durationNights: tour.durationNights,
    priceUsd: tour.priceUsd,
    priceOnRequest: tour.priceOnRequest,
    partnerSource: tour.partnerSource,
    startDate: date.start,
    endDate: date.end,
    spotsLeft: date.spotsLeft,
  };
}

export function buildMarketplaceDepartureIndex(
  tours: TourListing[],
  options?: { today?: Date }
): MarketplaceDepartureIndex {
  const today = startOfDay(options?.today ?? new Date());
  const byStartDate = new Map<string, MarketplaceDepartureItem[]>();
  const toursWithDates = new Set<string>();
  let tripsterWithoutDates = 0;
  let earliestDate: string | null = null;
  let latestDate: string | null = null;
  let totalDepartures = 0;

  for (const tour of tours) {
    const dates = tour.availableDates ?? [];
    if (isTripsterPartnerListing(tour) && dates.length === 0) {
      tripsterWithoutDates += 1;
      continue;
    }

    if (dates.length === 0) continue;

    toursWithDates.add(tour.id);

    for (const date of dates) {
      if (!date.start?.trim()) continue;
      if (!isFutureOrTodayDateKey(date.start, today)) continue;

      const bucket = byStartDate.get(date.start) ?? [];
      bucket.push(listingDateToItem(tour, date));
      byStartDate.set(date.start, bucket);
      totalDepartures += 1;

      if (!earliestDate || date.start < earliestDate) earliestDate = date.start;
      if (!latestDate || date.start > latestDate) latestDate = date.start;
    }
  }

  for (const [key, items] of byStartDate.entries()) {
    items.sort((a, b) => a.tourTitle.localeCompare(b.tourTitle, "ru"));
    byStartDate.set(key, items);
  }

  return {
    byStartDate,
    totalDepartures,
    tourCountWithDates: toursWithDates.size,
    tripsterWithoutDates,
    earliestDate,
    latestDate,
  };
}

export function resolveMarketplaceDepartureDayCount(
  index: MarketplaceDepartureIndex,
  day: Date
): number {
  const key = format(day, "yyyy-MM-dd");
  return index.byStartDate.get(key)?.length ?? 0;
}

export function buildTourDepartureHref(slug: string, startDate: string): string {
  const params = new URLSearchParams({ departure: startDate });
  return `/tours/${slug}?${params.toString()}#booking`;
}
