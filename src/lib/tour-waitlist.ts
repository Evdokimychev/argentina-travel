import type { TourDetail } from "@/types";
import {
  findBookableDates,
  validateGuestsForScheduledBooking,
  type BookingDateMode,
} from "@/lib/tour-booking-spots";

export type WaitlistScenarioKind = "none" | "selected_date" | "all_dates";

export interface WaitlistScenario {
  kind: WaitlistScenarioKind;
  reason: string;
  selectedDateId?: string;
}

export function isWaitlistFeatureEnabled(
  tour: Pick<TourDetail, "waitlistEnabled" | "priceOnRequest">
): boolean {
  return Boolean(tour.waitlistEnabled) && !tour.priceOnRequest;
}

export function resolveWaitlistScenario(
  tour: Pick<TourDetail, "waitlistEnabled" | "priceOnRequest" | "groupMin" | "dates">,
  guests: number,
  dateMode: BookingDateMode,
  selectedDateId: string
): WaitlistScenario {
  if (!isWaitlistFeatureEnabled(tour)) {
    return { kind: "none", reason: "" };
  }

  if (dateMode !== "scheduled" || tour.dates.length === 0) {
    return { kind: "none", reason: "" };
  }

  const validationError = validateGuestsForScheduledBooking(tour, guests, selectedDateId);
  if (!validationError) {
    return { kind: "none", reason: "" };
  }

  const alternatives = findBookableDates(tour.dates, guests, tour.groupMin);

  return {
    kind: alternatives.length === 0 ? "all_dates" : "selected_date",
    reason: validationError,
    selectedDateId,
  };
}

export function canOpenWaitlist(
  tour: Pick<TourDetail, "waitlistEnabled" | "priceOnRequest" | "groupMin" | "dates">,
  guests: number,
  dateMode: BookingDateMode,
  selectedDateId: string
): boolean {
  return resolveWaitlistScenario(tour, guests, dateMode, selectedDateId).kind !== "none";
}

export const WAITLIST_HINT =
  "Если места освободятся или наберётся группа, организатор свяжется с вами и предложит бронирование.";
