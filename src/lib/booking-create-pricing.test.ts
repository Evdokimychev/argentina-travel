import { describe, expect, it } from "vitest";
import { calculateCanonicalBookingPrice } from "@/lib/booking-create-pricing";

const rooms = [
  { id: "double", title: "Double", description: "", priceUsdPerTraveler: 0, capacity: 2 },
  { id: "single", title: "Single", description: "", priceUsdPerTraveler: 100, capacity: 1 },
];

describe("calculateCanonicalBookingPrice", () => {
  it("uses canonical prices for the complete total", () => {
    const result = calculateCanonicalBookingPrice({
      basePricePerTravelerUsd: 1_000,
      travelers: 2,
      roomOptions: rooms,
      selections: {
        roomAllocations: { single: 1, double: 1 },
        addonIds: ["private"],
        transferAllocations: { sedan: 2 },
      },
      calculatedAt: "2026-07-14T00:00:00.000Z",
    });

    expect(result).toMatchObject({
      baseTotalUsd: 2_000,
      accommodationTotalUsd: 100,
      addonsTotalUsd: 120,
      transferTotalUsd: 45,
      totalUsd: 2_265,
      currency: "USD",
      source: "canonical_tour",
    });
  });

  it("applies a canonical group discount instead of a client total", () => {
    const result = calculateCanonicalBookingPrice({
      basePricePerTravelerUsd: 1_000,
      travelers: 4,
      roomOptions: rooms,
      groupDiscount: {
        enabled: true,
        tiers: [{ id: "four", minGuests: 4, maxGuests: null, discountType: "percent", value: 10 }],
      },
    });

    expect(result.pricePerTravelerUsd).toBe(900);
    expect(result.totalUsd).toBe(3_600);
  });

  it("rejects unknown commercial options", () => {
    expect(() =>
      calculateCanonicalBookingPrice({
        basePricePerTravelerUsd: 1_000,
        travelers: 2,
        roomOptions: rooms,
        selections: {
          roomAllocations: { double: 2 },
          addonIds: ["client-price-minus-1000"],
        },
      })
    ).toThrow("недоступное дополнение");
  });
});
