import { startOfDay } from "date-fns";
import {
  TourListing,
  TourFilters,
  ChildrenPolicy,
  DEFAULT_FILTERS,
} from "@/types";
import { CurrencyCode } from "@/types/locale";
import { resolveListingFilterPriceUsd } from "@/lib/partner-tours/filter-price";
import { convertFromUsd, getFilterPriceMax } from "@/lib/currency";
import {
  DURATION_PRESETS,
  isDurationFilterActive,
} from "@/data/duration-presets";
import {
  getDefaultPriceRange,
  isPriceFilterActive,
} from "@/lib/tour-price-bounds";
import { matchesTourFormat } from "@/lib/tour-format";
import { resolveListingComfortLevel } from "@/lib/tour-accommodation";
import { resolveListingOwnerUserId } from "@/lib/organizer-public";
import {
  isTripsterPartnerListing,
} from "@/lib/tripster/partner-tour-utils";

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
  // Tripster не имеет дат заезда в нашей БД — не отсекаем по календарю.
  if (isTripsterPartnerListing(tour)) return true;

  const rangeStart = from ? startOfDay(from) : null;
  const rangeEnd = to ? startOfDay(to) : null;

  return tour.availableDates.some((d) => {
    const start = startOfDay(new Date(d.start));
    if (rangeStart && start < rangeStart) return false;
    if (rangeEnd && start > rangeEnd) return false;
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
  if (policy === "Только взрослые") {
    return tour.minimumAge >= requiredAge;
  }
  return tour.minimumAge <= requiredAge;
}

function matchesDuration(tour: TourListing, filters: TourFilters): boolean {
  if (filters.dayTripsOnly) return tour.durationDays === 1;

  if (filters.durations.length > 0) {
    return filters.durations.some((bucket) => {
      const preset = DURATION_PRESETS.find((p) => p.bucket === bucket);
      return (
        preset != null &&
        tour.durationDays >= preset.min &&
        tour.durationDays <= preset.max
      );
    });
  }

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
    const filterPriceUsd = resolveListingFilterPriceUsd(tour);
    if (filterPriceUsd != null) {
      const displayPrice = convertFromUsd(filterPriceUsd, currency);
      if (displayPrice < filters.priceMin || displayPrice > priceMax) return false;
    }

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
      !filters.comfortLevels.includes(resolveListingComfortLevel(tour))
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

    if (filters.tourFormats.length && !matchesTourFormat(tour, filters.tourFormats))
      return false;

    if (
      filters.organizerSlug.trim() &&
      resolveListingOwnerUserId(tour) !== filters.organizerSlug.trim() &&
      tour.organizer.slug !== filters.organizerSlug.trim()
    ) {
      return false;
    }

    if (filters.instantBookingOnly && tour.partnerInstantBooking !== true) {
      return false;
    }

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
  currency: CurrencyCode,
  tours: TourListing[] = []
): number {
  let n = 0;
  if (filters.query) n++;
  if (filters.dateFrom || filters.dateTo) n++;
  if (filters.activityTypes.length) n++;
  if (isPriceFilterActive(filters.priceMin, filters.priceMax, currency, tours)) n++;
  if (isDurationFilterActive(filters)) n++;
  if (filters.accommodations.length) n++;
  if (filters.comfortLevels.length) n++;
  if (filters.difficultyLevels.length) n++;
  if (filters.languages.length) n++;
  if (filters.childrenPolicy) n++;
  if (filters.groupSizes.length) n++;
  if (filters.tourFormats.length) n++;
  if (filters.nearMe) n++;
  if (filters.organizerSlug.trim()) n++;
  if (filters.instantBookingOnly) n++;
  return n;
}

export function getDefaultFilters(
  currency: CurrencyCode,
  tours: TourListing[] = []
): TourFilters {
  return {
    ...DEFAULT_FILTERS,
    ...getDefaultPriceRange(tours, currency),
  };
}
