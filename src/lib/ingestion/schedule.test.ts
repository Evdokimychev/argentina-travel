import { describe, expect, it } from "vitest";
import { nextSourceRunAt } from "@/lib/ingestion/schedule";

describe("ingestion schedule", () => {
  it("calculates interval schedules", () => {
    expect(nextSourceRunAt({ enabled: true, scheduleKind: "interval", scheduleExpression: "6h" }, new Date("2026-07-19T12:00:00Z"))).toBe("2026-07-19T18:00:00.000Z");
  });

  it("calculates cron schedules in the Argentina timezone", () => {
    expect(nextSourceRunAt({ enabled: true, scheduleKind: "cron", scheduleExpression: "0 9 * * *" }, new Date("2026-07-19T12:30:00Z"))).toBe("2026-07-20T12:00:00.000Z");
  });

  it("does not schedule disabled or manual sources", () => {
    expect(nextSourceRunAt({ enabled: false, scheduleKind: "cron", scheduleExpression: "0 * * * *" })).toBeNull();
    expect(nextSourceRunAt({ enabled: true, scheduleKind: "manual", scheduleExpression: null })).toBeNull();
  });
});
