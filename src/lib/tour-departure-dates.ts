import { isValid, parseISO, startOfDay } from "date-fns";
import type { TourListing } from "@/types";

/** Earliest upcoming departure start date (YYYY-MM-DD), or null if none. */
export function resolveNearestUpcomingDepartureStart(
  tour: Pick<TourListing, "availableDates">,
  today = startOfDay(new Date()),
): string | null {
  let nearest: string | null = null;

  for (const date of tour.availableDates ?? []) {
    const start = date.start?.trim();
    if (!start) continue;

    const parsed = parseISO(start);
    if (!isValid(parsed) || startOfDay(parsed) < today) continue;

    if (nearest == null || start < nearest) {
      nearest = start;
    }
  }

  return nearest;
}

export function resolveNearestUpcomingDepartureTimestamp(
  tour: Pick<TourListing, "availableDates">,
  today = startOfDay(new Date()),
): number {
  const start = resolveNearestUpcomingDepartureStart(tour, today);
  return start ? parseISO(start).getTime() : Number.MAX_SAFE_INTEGER;
}
