import { describe, expect, it } from "vitest";
import {
  formatExcursionBookingPreviewTimeLabel,
  parseBookingPreviewPriceLabel,
} from "@/components/booking/BookingPreviewCard";

const t = (key: string) =>
  ({
    "excursions.duration.min": "мин",
    "excursions.duration.h": "ч",
  })[key] ?? key;

describe("parseBookingPreviewPriceLabel", () => {
  it("splits amount and per-group caption", () => {
    expect(parseBookingPreviewPriceLabel("$150 за 3 человек")).toEqual({
      amount: "$150",
      caption: "за 3 человек",
    });
  });

  it("keeps plain amounts unchanged", () => {
    expect(parseBookingPreviewPriceLabel("3490 USD")).toEqual({
      amount: "3490 USD",
    });
  });

  it("strips catalog from-prefix when guests are already chosen", () => {
    expect(
      parseBookingPreviewPriceLabel("от $150", { stripFromPrefix: true })
    ).toEqual({
      amount: "$150",
    });
  });
});

describe("formatExcursionBookingPreviewTimeLabel", () => {
  it("returns em dash when start time is missing", () => {
    expect(formatExcursionBookingPreviewTimeLabel({ t })).toBe("—");
  });

  it("shows slot time range when timeEnd is provided", () => {
    expect(
      formatExcursionBookingPreviewTimeLabel({
        startTime: "13:00",
        timeEnd: "16:00",
        durationMinutes: 180,
        t,
      })
    ).toBe("13:00–16:00");
  });

  it("combines start, calculated end, and duration on one line", () => {
    expect(
      formatExcursionBookingPreviewTimeLabel({
        startTime: "17:00",
        durationMinutes: 180,
        t,
      })
    ).toBe("17:00 – 20:00, ≈ 3 ч");
  });

  it("shows start with duration hint when end cannot be calculated", () => {
    expect(
      formatExcursionBookingPreviewTimeLabel({
        startTime: "invalid",
        durationMinutes: 90,
        t,
      })
    ).toBe("invalid, ≈ 1 ч 30 мин");
  });

  it("shows only start time when duration is unknown", () => {
    expect(
      formatExcursionBookingPreviewTimeLabel({
        startTime: "17:00",
        t,
      })
    ).toBe("17:00");
  });
});
