import { AccommodationType, TourDetail } from "@/types";

export const NO_ACCOMMODATION_LABEL = "Без проживания" as const;

export const NO_ACCOMMODATION_INFO = {
  level: NO_ACCOMMODATION_LABEL,
  description:
    "Однодневный тур без ночёвки. Проживание не включено в программу и не требуется.",
  scale: 0,
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
