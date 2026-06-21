import { describe, expect, it } from "vitest";
import {
  datetimeLocalValueToScheduledPublishAt,
  scheduledPublishAtToDatetimeLocalValue,
  validateScheduledPublishAt,
} from "@/lib/cms/cms-scheduled-publish";

describe("validateScheduledPublishAt", () => {
  it("rejects past dates", () => {
    const result = validateScheduledPublishAt("2020-01-01T00:00:00.000Z", Date.UTC(2026, 0, 1));
    expect(result.ok).toBe(false);
  });

  it("accepts future dates", () => {
    const now = Date.UTC(2026, 0, 1, 12, 0, 0);
    const future = new Date(now + 120_000).toISOString();
    const result = validateScheduledPublishAt(future, now);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.iso).toBe(future);
  });
});

describe("datetime local helpers", () => {
  it("round-trips through datetime-local value", () => {
    const iso = "2026-06-25T14:30:00.000Z";
    const local = scheduledPublishAtToDatetimeLocalValue(iso);
    expect(local).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    const back = datetimeLocalValueToScheduledPublishAt(local);
    expect(back).toBeTruthy();
  });
});
