import { describe, expect, it } from "vitest";
import { resolvePartnerDepartureCapacity } from "@/lib/partner-tour/departure-capacity";
import {
  listTripsterUpcomingDepartureDates,
  resolveTripsterDepartureCapacity,
} from "@/lib/tripster/partner-tour-details";
import {
  mapScheduleToAvailableDates,
  mapScheduleToPartnerDates,
  resolveScheduleSlotSpotsLeft,
} from "@/lib/tripster/partner-tour-content";

describe("Tripster partner departure details", () => {
  it("returns 0 spots when slot has no availability data", () => {
    expect(resolveScheduleSlotSpotsLeft({}, {})).toBe(0);
  });

  it("maps schedule to partner dates with seats total", () => {
    const dates = mapScheduleToPartnerDates(
      {
        schedule: {
          "2026-09-01": [{ time: "08:00", available_persons: 4 }],
          "2026-10-01": [{ time: "08:00", available_persons: 8 }],
        },
      },
      7,
      "RUB",
      12,
    );

    expect(dates).toHaveLength(2);
    expect(dates[0]?.spotsLeft).toBe(4);
    expect(dates[0]?.seatsTotal).toBe(12);
  });

  it("builds catalog available dates from schedule", () => {
    const available = mapScheduleToAvailableDates(
      {
        schedule: {
          "2026-09-01": [
            { time: "08:00", available_persons: 4 },
            { time: "14:00", available_persons: 2 },
          ],
        },
      },
      5,
    );

    expect(available).toHaveLength(1);
    expect(available[0]?.spotsLeft).toBe(4);
  });

  it("resolves capacity from group max and spots left", () => {
    const capacity = resolveTripsterDepartureCapacity(
      { groupMax: 12 },
      { spotsLeft: 4, seatsTotal: 12 },
    );

    expect(capacity).toEqual({ total: 12, booked: 8, free: 4 });
    expect(resolvePartnerDepartureCapacity({ groupMax: 12 }, { spotsLeft: 4 })).toEqual(capacity);
  });

  it("lists only upcoming departures", () => {
    const upcoming = listTripsterUpcomingDepartureDates(
      [
        { id: "past", startDate: "2020-01-01", endDate: "2020-01-07", spotsLeft: 0, priceUsd: 1 },
        { id: "future", startDate: "2026-12-01", endDate: "2026-12-07", spotsLeft: 3, priceUsd: 1 },
      ],
      "2026-06-22",
    );

    expect(upcoming.map((date) => date.id)).toEqual(["future"]);
  });
});
