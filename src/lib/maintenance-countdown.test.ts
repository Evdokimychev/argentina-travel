import { describe, expect, it } from "vitest";
import {
  getMaintenanceCountdownParts,
  parseMaintenanceCountdownTarget,
} from "@/lib/maintenance-countdown";

describe("getMaintenanceCountdownParts", () => {
  it("returns zero parts when target is in the past", () => {
    expect(
      getMaintenanceCountdownParts(new Date("2020-01-01T00:00:00Z"), new Date("2025-01-01T00:00:00Z"))
    ).toEqual({
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: true,
    });
  });

  it("breaks down remaining time", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const target = new Date("2026-02-16T13:45:30Z");
    const parts = getMaintenanceCountdownParts(target, now);
    expect(parts.expired).toBe(false);
    expect(parts.months).toBeGreaterThan(0);
    expect(parts.seconds).toBe(30);
  });
});

describe("parseMaintenanceCountdownTarget", () => {
  it("parses valid ISO date", () => {
    const parsed = parseMaintenanceCountdownTarget("2026-07-15T12:00:00.000Z");
    expect(parsed?.toISOString()).toBe("2026-07-15T12:00:00.000Z");
  });

  it("returns null for invalid input", () => {
    expect(parseMaintenanceCountdownTarget("")).toBeNull();
    expect(parseMaintenanceCountdownTarget("not-a-date")).toBeNull();
  });
});
