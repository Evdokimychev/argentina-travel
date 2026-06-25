import { describe, expect, it } from "vitest";
import {
  assertDepartureCapacityConsistent,
  assertPriceNormalizationSane,
} from "@/lib/youtravel/partner-invariants";

describe("assertDepartureCapacityConsistent", () => {
  it("accepts consistent capacity", () => {
    expect(() =>
      assertDepartureCapacityConsistent({ total: 14, booked: 5, free: 9 })
    ).not.toThrow();
  });

  it("rejects booked + free != total", () => {
    expect(() =>
      assertDepartureCapacityConsistent({ total: 14, booked: 5, free: 8 })
    ).toThrow(/must equal total/);
  });

  it("rejects booked exceeding total", () => {
    expect(() =>
      assertDepartureCapacityConsistent({ total: 8, booked: 9, free: 0 })
    ).toThrow(/exceeds total/);
  });
});

describe("assertPriceNormalizationSane", () => {
  it("accepts realistic USD partner price", () => {
    expect(() =>
      assertPriceNormalizationSane({
        rawValue: 5628,
        rawCurrency: "RUB",
        normalizedValue: 5628,
        normalizedCurrency: "USD",
        priceUsd: 5628,
      })
    ).not.toThrow();
  });

  it("rejects absurd USD after mislabeling", () => {
    expect(() =>
      assertPriceNormalizationSane({
        rawValue: 37766,
        rawCurrency: "USD",
        normalizedValue: 37766,
        normalizedCurrency: "USD",
        priceUsd: 37766,
      })
    ).toThrow(/outside sane tour bounds/);
  });
});
