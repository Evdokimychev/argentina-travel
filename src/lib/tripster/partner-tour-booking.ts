import type { TripsterExperience } from "@/lib/tripster/types";
import type { TourBookingMode } from "@/types";

/** Режим бронирования партнёрского тура по данным Tripster и наличию дат. */
export function resolvePartnerTourBookingMode(
  experience: Pick<TripsterExperience, "format" | "max_persons"> | undefined,
  datesCount: number
): TourBookingMode {
  if (datesCount > 0) return "scheduled";

  const format = experience?.format?.trim().toLowerCase();
  const isPrivateFormat = format === "private" || format === "individual";
  if (isPrivateFormat || experience?.max_persons === 1) {
    return "on_request";
  }

  // Даты подгрузятся с API — показываем выбор дат, а не календарь «по запросу».
  return "scheduled";
}
