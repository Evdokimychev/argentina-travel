import { describe, expect, it } from "vitest";
import { scrubMonitoringData } from "./monitoring-scrub";

describe("monitoring PII / secret scrubbing", () => {
  it("redacts sensitive keys and email-like values", () => {
    expect(
      scrubMonitoringData({
        bookingId: "booking-1",
        email: "tourist@example.com",
        stripeSecret: "sk_live_example",
        note: "contact tourist@example.com please",
      }),
    ).toEqual({
      bookingId: "booking-1",
      email: "[redacted]",
      stripeSecret: "[redacted]",
      note: "[redacted]",
    });
  });

  it("returns undefined for empty input", () => {
    expect(scrubMonitoringData(undefined)).toBeUndefined();
  });
});
