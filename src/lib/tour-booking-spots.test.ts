import { describe, expect, it } from "vitest";
import type { TourDatePrice } from "@/types";
import {
  dateFitsGuestCount,
  findBookableDates,
  isTourDateCurrentOrFuture,
  pickInitialDateId,
  validateGuestsForScheduledBooking,
} from "@/lib/tour-booking-spots";

const NOW = new Date("2026-07-17T12:00:00.000Z");

function departure(
  id: string,
  startDate: string,
  spotsLeft = 8
): TourDatePrice {
  return {
    id,
    startDate,
    endDate: startDate,
    spotsLeft,
    priceUsd: 1_000,
  };
}

describe("tour booking date availability", () => {
  it("uses the same UTC calendar boundary as canonical booking creation", () => {
    expect(isTourDateCurrentOrFuture(departure("past", "2026-07-16"), NOW)).toBe(false);
    expect(isTourDateCurrentOrFuture(departure("today", "2026-07-17"), NOW)).toBe(true);
    expect(isTourDateCurrentOrFuture(departure("future", "2026-07-18"), NOW)).toBe(true);
    expect(isTourDateCurrentOrFuture(departure("invalid", "not-a-date"), NOW)).toBe(false);
    expect(isTourDateCurrentOrFuture(departure("invalid-month", "2026-99-01"), NOW)).toBe(false);
  });

  it("never offers a past departure even when it has enough spots", () => {
    const dates = [
      departure("past", "2025-11-15", 20),
      departure("full", "2026-08-01", 1),
      departure("future", "2026-09-01", 8),
    ];

    expect(dateFitsGuestCount(dates[0], 2, 2, NOW)).toBe(false);
    expect(findBookableDates(dates, 2, 2, NOW).map((date) => date.id)).toEqual([
      "future",
    ]);
    expect(pickInitialDateId(dates, 2, 2, NOW)).toBe("future");
  });

  it("keeps a future full departure selectable for waitlist but never falls back to a past one", () => {
    const dates = [
      departure("past", "2026-01-01", 8),
      departure("future-full", "2026-08-01", 1),
    ];

    expect(pickInitialDateId(dates, 2, 2, NOW)).toBe("future-full");
    expect(pickInitialDateId([dates[0]], 2, 2, NOW)).toBe("");
  });

  it("fails closed with an owner-readable error for a stale selected id", () => {
    const past = departure("past", "2025-11-15", 20);
    expect(
      validateGuestsForScheduledBooking(
        { groupMin: 2, dates: [past] },
        2,
        past.id,
        NOW
      )
    ).toBe("Дата поездки уже прошла. Выберите новую дату.");
  });
});
