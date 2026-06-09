import { TourListing, AccommodationType, DurationBucket } from "@/types";

export function countToursByAccommodation(
  tours: TourListing[]
): Record<AccommodationType, number> {
  const counts = {} as Record<AccommodationType, number>;
  for (const tour of tours) {
    counts[tour.accommodationType] = (counts[tour.accommodationType] ?? 0) + 1;
  }
  return counts;
}

export function countToursByField<T extends string>(
  tours: TourListing[],
  getter: (tour: TourListing) => T
): Record<T, number> {
  const counts = {} as Record<T, number>;
  for (const tour of tours) {
    const key = getter(tour);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function countDayTripTours(tours: TourListing[]): number {
  return tours.filter((tour) => tour.durationDays === 1).length;
}

export function countToursByDurationBucket(
  tours: TourListing[]
): Partial<Record<DurationBucket, number>> {
  const counts: Partial<Record<DurationBucket, number>> = {};
  for (const tour of tours) {
    counts[tour.durationBucket] = (counts[tour.durationBucket] ?? 0) + 1;
  }
  return counts;
}
