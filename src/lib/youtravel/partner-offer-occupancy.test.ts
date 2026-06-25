import { describe, expect, it } from "vitest";
import { CAPACITY_REGRESSION_CASES } from "@/lib/youtravel/__fixtures__/regression-payloads";
import {
  resolveOfferFreeSpaces,
  resolveOfferSeatsTotal,
  resolveTravelersGoingFromOffer,
} from "@/lib/youtravel/partner-offer-occupancy";

describe("resolveTravelersGoingFromOffer", () => {
  it("derives booked count from total minus free spaces", () => {
    expect(
      resolveTravelersGoingFromOffer({
        seatsTotal: 14,
        freeSpaces: 9,
      }),
    ).toBe(5);
  });

  it("returns zero when all seats are free", () => {
    expect(
      resolveTravelersGoingFromOffer({
        seatsTotal: 8,
        freeSpaces: 8,
        travelers_count: 8,
        participants_count: 8,
      }),
    ).toBe(0);
  });

  it("reads dedicated booked fields when free count is missing", () => {
    expect(
      resolveTravelersGoingFromOffer({
        booked_spaces: 3,
        seatsTotal: 10,
      }),
    ).toBe(3);
  });

  it("ignores travelers_count without free or booked fields", () => {
    expect(
      resolveTravelersGoingFromOffer({
        travelers_count: 8,
        seatsTotal: 8,
      }),
    ).toBeUndefined();
  });
});

describe("resolveOfferFreeSpaces", () => {
  it("prefers explicit free spaces", () => {
    expect(
      resolveOfferFreeSpaces({
        freeSpaces: 6,
        seatsTotal: 10,
        booked_spaces: 99,
      }),
    ).toBe(6);
  });

  it("derives free from total and dedicated booked count", () => {
    expect(
      resolveOfferFreeSpaces({
        seatsTotal: 10,
        booked_spaces: 3,
      }),
    ).toBe(7);
  });
});

describe("resolveOfferSeatsTotal", () => {
  it("reads seats total and group size aliases", () => {
    expect(resolveOfferSeatsTotal({ seatsTotal: 12 })).toBe(12);
    expect(resolveOfferSeatsTotal({ max_group_size: 8 })).toBe(8);
  });
});

describe("capacity regression fixtures", () => {
  describe.each(CAPACITY_REGRESSION_CASES)("$id", ({ offer, expected }) => {
    it("maps offer occupancy fields", () => {
      expect(resolveOfferFreeSpaces(offer)).toBe(expected.spotsLeft);
      if (expected.seatsTotal != null) {
        expect(resolveOfferSeatsTotal(offer)).toBe(expected.seatsTotal);
      }
      if (expected.travelersGoingCount !== undefined) {
        expect(resolveTravelersGoingFromOffer(offer)).toBe(expected.travelersGoingCount);
      }
    });
  });
});
