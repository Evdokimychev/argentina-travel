import { describe, expect, it } from "vitest";
import {
  formatExcursionBookingPreviewDateLabel,
  formatExcursionScheduleDayLabel,
} from "@/lib/excursion-date-label";

describe("formatExcursionScheduleDayLabel", () => {
  it("formats Russian with abbreviated weekday", () => {
    expect(formatExcursionScheduleDayLabel("2026-07-05", "ru")).toBe("5 июля, вс");
  });

  it("formats English with abbreviated weekday", () => {
    expect(formatExcursionScheduleDayLabel("2026-07-05", "en")).toBe("5 July, Sun");
  });
  it("formats Portuguese with abbreviated weekday", () => {
    expect(formatExcursionScheduleDayLabel("2026-07-05", "pt")).toBe("5 julho, dom");
  });
});

describe("formatExcursionBookingPreviewDateLabel", () => {
  it("formats Russian with year and abbreviated weekday", () => {
    expect(formatExcursionBookingPreviewDateLabel("2026-07-05", "ru")).toBe(
      "5 июля 2026 г., вс"
    );
  });

  it("formats English with year and abbreviated weekday", () => {
    expect(formatExcursionBookingPreviewDateLabel("2026-07-05", "en")).toBe(
      "5 July 2026, Sun"
    );
  });

  it("formats Spanish with year and abbreviated weekday", () => {
    expect(formatExcursionBookingPreviewDateLabel("2026-07-05", "es")).toBe(
      "5 julio 2026, dom"
    );
  });

  it("formats Portuguese with year and abbreviated weekday", () => {
    expect(formatExcursionBookingPreviewDateLabel("2026-07-05", "pt")).toBe(
      "5 julho 2026, dom"
    );
  });
});
