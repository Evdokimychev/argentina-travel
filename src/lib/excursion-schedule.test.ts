import { describe, expect, it } from "vitest";
import {
  ceilMinutesToScheduleStep,
  normalizeScheduleTime,
  parseExcursionSchedule,
  TRIPSTER_RANGE_SLOT_STEP_MINUTES,
} from "@/lib/excursion-schedule";

describe("normalizeScheduleTime", () => {
  it("strips seconds and keeps HH:MM", () => {
    expect(normalizeScheduleTime("21:14:00")).toBe("21:14");
    expect(normalizeScheduleTime("8:5")).toBe("08:05");
  });
});

describe("ceilMinutesToScheduleStep", () => {
  it("keeps grid-aligned minutes unchanged", () => {
    expect(ceilMinutesToScheduleStep(21 * 60, TRIPSTER_RANGE_SLOT_STEP_MINUTES)).toBe(21 * 60);
    expect(ceilMinutesToScheduleStep(21 * 60 + 30, TRIPSTER_RANGE_SLOT_STEP_MINUTES)).toBe(
      21 * 60 + 30
    );
  });

  it("rounds up to the next 30-minute step", () => {
    expect(ceilMinutesToScheduleStep(21 * 60 + 19, TRIPSTER_RANGE_SLOT_STEP_MINUTES)).toBe(
      21 * 60 + 30
    );
    expect(ceilMinutesToScheduleStep(19 * 60 + 17, TRIPSTER_RANGE_SLOT_STEP_MINUTES)).toBe(
      19 * 60 + 30
    );
  });
});

describe("parseExcursionSchedule — Tripster range slots", () => {
  it("expands future dates on the 30-minute grid", () => {
    const parsed = parseExcursionSchedule({
      schedule: {
        "2026-07-01": [{ type: "range", time_start: "08:30", time_end: "22:00" }],
      },
    });

    expect(parsed.dates[0]?.slots.map((slot) => slot.time)).toEqual([
      "08:30",
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
      "12:00",
      "12:30",
      "13:00",
      "13:30",
      "14:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
      "16:30",
      "17:00",
      "17:30",
      "18:00",
      "18:30",
      "19:00",
      "19:30",
      "20:00",
      "20:30",
      "21:00",
      "21:30",
      "22:00",
    ]);
  });

  it("snaps dynamic same-day range start to the booking grid", () => {
    const parsed = parseExcursionSchedule({
      schedule: {
        "2026-06-27": [{ type: "range", time_start: "21:19", time_end: "22:00" }],
      },
    });

    expect(parsed.dates[0]?.slots.map((slot) => slot.time)).toEqual(["21:30", "22:00"]);
  });

  it("expands overnight ranges ending at midnight", () => {
    const parsed = parseExcursionSchedule({
      schedule: {
        "2026-06-27": [{ type: "range", time_start: "19:17", time_end: "00:00" }],
      },
    });

    const times = parsed.dates[0]?.slots.map((slot) => slot.time) ?? [];
    expect(times[0]).toBe("19:30");
    expect(times.at(-1)).toBe("23:30");
    expect(times).not.toContain("19:17");
  });

  it("keeps discrete slot times unchanged", () => {
    const parsed = parseExcursionSchedule({
      schedule: {
        "2026-07-01": [{ type: "slot", time: "21:00" }],
      },
    });

    expect(parsed.dates[0]?.slots).toEqual([{ time: "21:00" }]);
  });
});
