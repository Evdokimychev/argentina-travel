import { AccommodationType, ComfortLevel, TourDetail, TourListing } from "@/types";
import { COMFORT_DOT_COUNT, COMFORT_LEVELS } from "@/data/tour-levels";

export const NO_ACCOMMODATION_LABEL = "Без проживания" as const satisfies ComfortLevel;

export const NO_ACCOMMODATION_INFO = {
  level: NO_ACCOMMODATION_LABEL,
  description:
    COMFORT_LEVELS.find((item) => item.level === NO_ACCOMMODATION_LABEL)?.description ?? "",
  scale: COMFORT_DOT_COUNT[NO_ACCOMMODATION_LABEL],
};

export function resolveAccommodationType(
  tour: Pick<TourDetail, "accommodationType" | "durationNights">
): AccommodationType {
  if (tour.accommodationType) return tour.accommodationType;
  return tour.durationNights === 0 ? "Без проживания" : "Отель";
}

export function tourHasAccommodation(
  tour: Pick<TourDetail, "accommodationType" | "durationNights" | "accommodations">
): boolean {
  const type = resolveAccommodationType(tour);
  if (type === "Без проживания") return false;
  if (tour.durationNights === 0) return false;
  return tour.accommodations.length > 0;
}

export function resolveTourComfortLevel(
  tour: Pick<TourDetail, "comfort" | "accommodationType" | "durationNights" | "accommodations">
): ComfortLevel {
  if (!tourHasAccommodation(tour)) return NO_ACCOMMODATION_LABEL;
  return tour.comfort;
}

export function resolveListingComfortLevel(
  tour: Pick<TourListing, "comfortLevel" | "accommodationType" | "durationNights">
): ComfortLevel {
  if (tour.accommodationType === "Без проживания" || tour.durationNights === 0) {
    return NO_ACCOMMODATION_LABEL;
  }
  return tour.comfortLevel;
}
