import type { TourDatePrice, TourDetail } from "@/types";

export type PartnerDepartureCapacity = {
  total: number;
  booked: number;
  free: number;
};

/** Вместимость заезда партнёра: total = groupMax, free = spotsLeft, booked = total − free. */
export function resolvePartnerDepartureCapacity(
  tour: Pick<TourDetail, "groupMax">,
  date?: Pick<TourDatePrice, "spotsLeft" | "seatsTotal">,
): PartnerDepartureCapacity | null {
  if (!date) return null;

  const total =
    date.seatsTotal != null && date.seatsTotal > 0
      ? date.seatsTotal
      : tour.groupMax > 0
        ? tour.groupMax
        : undefined;

  if (total == null || total <= 0) return null;
  if (date.spotsLeft == null || date.spotsLeft < 0) return null;

  const free = Math.min(Math.max(0, date.spotsLeft), total);
  return { total, booked: Math.max(0, total - free), free };
}

export function formatPartnerDepartureOccupancySummary(
  capacity: PartnerDepartureCapacity,
): string {
  if (capacity.free <= 0) {
    return "Группа набрана — уточните наличие мест у организатора.";
  }
  if (capacity.booked <= 0) {
    return "Пока никто не записался — все места свободны.";
  }
  return `Занято ${capacity.booked} из ${capacity.total} мест.`;
}
