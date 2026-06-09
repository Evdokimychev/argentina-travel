import {
  TourListing,
  TourFilters,
  ChildrenPolicy,
  DEFAULT_FILTERS,
} from "@/types";
import { CurrencyCode } from "@/types/locale";
import { convertFromUsd, getFilterPriceMax } from "@/lib/currency";
import { isDurationFilterActive } from "@/data/duration-presets";

const CHILD_AGE_MAP: Record<ChildrenPolicy, number> = {
  "Без ограничений": 0,
  "От 2 лет": 2,
  "От 5 лет": 5,
  "От 8 лет": 8,
  "От 12 лет": 12,
  "От 16 лет": 16,
  "Только взрослые": 18,
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function matchesDateRange(tour: TourListing, from: Date | null, to: Date | null) {
  if (!from && !to) return true;
  return tour.availableDates.some((d) => {
    const start = new Date(d.start);
    if (from && start < from) return false;
    if (to && start > to) return false;
    return true;
  });
}

function matchesQuery(tour: TourListing, query: string) {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return (
    tour.title.toLowerCase().includes(q) ||
    tour.destination.toLowerCase().includes(q) ||
    tour.region.toLowerCase().includes(q) ||
    tour.shortDescription.toLowerCase().includes(q)
  );
}

function matchesChildren(tour: TourListing, policy: ChildrenPolicy | null) {
  if (!policy) return true;
  const requiredAge = CHILD_AGE_MAP[policy];
  return tour.minimumAge <= requiredAge;
}

function matchesDuration(tour: TourListing, filters: TourFilters): boolean {
  if (filters.dayTripsOnly) return tour.durationDays === 1;

  const hasRange = filters.durationMin != null || filters.durationMax != null;
  if (hasRange) {
    const min = filters.durationMin ?? 1;
    const max = filters.durationMax ?? 365;
    return tour.durationDays >= min && tour.durationDays <= max;
  }

  return true;
}

export function filterTours(
  tours: TourListing[],
  filters: TourFilters,
  currency: CurrencyCode
): TourListing[] {
  const priceMax = filters.priceMax || getFilterPriceMax(currency);

  let result = tours.filter((tour) => {
    if (!matchesQuery(tour, filters.query)) return false;
    if (!matchesDateRange(tour, filters.dateFrom, filters.dateTo)) return false;
    const displayPrice = convertFromUsd(tour.priceUsd, currency);
    if (displayPrice < filters.priceMin || displayPrice > priceMax) return false;

    if (
      filters.activityTypes.length &&
      !filters.activityTypes.includes(tour.activityType)
    )
      return false;

    if (!matchesDuration(tour, filters)) return false;

    if (
      filters.accommodations.length &&
      !filters.accommodations.includes(tour.accommodationType)
    )
      return false;

    if (
      filters.comfortLevels.length &&
      !filters.comfortLevels.includes(tour.comfortLevel)
    )
      return false;

    if (
      filters.difficultyLevels.length &&
      !filters.difficultyLevels.includes(tour.difficultyLevel)
    )
      return false;

    if (
      filters.languages.length &&
      !filters.languages.some((l) => tour.language.includes(l))
    )
      return false;

    if (!matchesChildren(tour, filters.childrenPolicy)) return false;

    if (
      filters.groupSizes.length &&
      !filters.groupSizes.includes(tour.groupSizeBucket)
    )
      return false;

    return true;
  });

  if (filters.nearMe && filters.userCoords) {
    result = [...result].sort(
      (a, b) =>
        haversineKm(
          filters.userCoords!.lat,
          filters.userCoords!.lng,
          a.latitude,
          a.longitude
        ) -
        haversineKm(
          filters.userCoords!.lat,
          filters.userCoords!.lng,
          b.latitude,
          b.longitude
        )
    );
  }

  return result;
}

export function countActiveFilters(
  filters: TourFilters,
  currency: CurrencyCode
): number {
  const priceMax = filters.priceMax || getFilterPriceMax(currency);
  let n = 0;
  if (filters.query) n++;
  if (filters.dateFrom || filters.dateTo) n++;
  if (filters.activityTypes.length) n++;
  if (filters.priceMin > 0 || filters.priceMax < priceMax) n++;
  if (isDurationFilterActive(filters)) n++;
  if (filters.accommodations.length) n++;
  if (filters.comfortLevels.length) n++;
  if (filters.difficultyLevels.length) n++;
  if (filters.languages.length) n++;
  if (filters.childrenPolicy) n++;
  if (filters.groupSizes.length) n++;
  if (filters.nearMe) n++;
  return n;
}

export function getDefaultFilters(currency: CurrencyCode): TourFilters {
  return {
    ...DEFAULT_FILTERS,
    priceMax: getFilterPriceMax(currency),
  };
}
