import { describe, expect, it } from "vitest";
import {
  buildExcursionCalendarDates,
  formatExcursionCalendarPrice,
  resolveExcursionAdditionalServices,
  resolveExcursionDatePrice,
} from "@/lib/excursion-calendar";

describe("resolveExcursionDatePrice", () => {
  it("picks the cheapest slot on a date", () => {
    expect(
      resolveExcursionDatePrice({
        slots: [
          { time: "10:00", priceValue: 180, priceText: "$180" },
          { time: "14:00", priceValue: 150, priceText: "$150" },
        ],
      })
    ).toEqual({ priceValue: 150, priceText: "$150" });
  });
});

describe("buildExcursionCalendarDates", () => {
  it("maps schedule dates with aggregated prices", () => {
    expect(
      buildExcursionCalendarDates([
        {
          date: "2026-07-01",
          slots: [{ time: "10:00", priceValue: 150, priceText: "$150" }],
        },
      ])
    ).toEqual([{ date: "2026-07-01", priceValue: 150, priceText: "$150" }]);
  });
});

describe("formatExcursionCalendarPrice", () => {
  it("prefers compact price text", () => {
    expect(formatExcursionCalendarPrice({ priceText: "$150", priceValue: 150 })).toBe("$150");
  });

  it("formats numeric values", () => {
    expect(formatExcursionCalendarPrice({ priceValue: 150 })).toBe("$150");
  });
});

describe("resolveExcursionAdditionalServices", () => {
  it("returns non-participant add-ons", () => {
    expect(
      resolveExcursionAdditionalServices([
        { id: 1, title: "Взрослый", isDefault: true, value: 45 },
        { id: 2, title: "Шоу танго", value: 157 },
      ])
    ).toEqual([{ id: 2, title: "Шоу танго", value: 157 }]);
  });

  it("falls back to non-default tickets", () => {
    expect(
      resolveExcursionAdditionalServices([
        { id: 1, title: "Взрослый", isDefault: true, value: 45 },
        { id: 2, title: "Ребёнок", value: 30 },
      ])
    ).toEqual([{ id: 2, title: "Ребёнок", value: 30 }]);
  });
});
