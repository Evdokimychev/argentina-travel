import { describe, expect, it } from "vitest";
import { CAPACITY_REGRESSION_CASES } from "@/lib/youtravel/__fixtures__/regression-payloads";
import { assertDepartureCapacityConsistent } from "@/lib/youtravel/partner-invariants";
import { resolveYouTravelDepartureCapacity } from "@/lib/youtravel/partner-tour-details";
import type { YouTravelTourRow } from "@/lib/youtravel/partner-tour-repository";
import { youtravelRowToDetail } from "@/lib/youtravel/partner-tour-mapper";

function buildMinimalRow(id: number, groupMax: number): YouTravelTourRow {
  return {
    id,
    slug: `test-tour-yt${id}`,
    title: "Regression tour",
    country: "Аргентина",
    region: "Патагония",
    city: null,
    status: "published",
    duration_days: 8,
    duration_nights: 7,
    rating: 4.8,
    review_count: 12,
    price_value: 5628,
    price_currency: "USD",
    price_display: "5 628 $",
    youtravel_url: "https://youtravel.me/tours/test",
    partner_url: null,
    cover_image: null,
    photos: [],
    payload: {
      max_group_size: groupMax,
      group_size: groupMax,
    },
  };
}

describe("youtravelRowToDetail capacity regressions", () => {
  describe.each(CAPACITY_REGRESSION_CASES)("($id)", ({ id, offer, groupMax, expected, bug }) => {
    it(`maps schedule dates: ${bug}`, () => {
      const detail = youtravelRowToDetail(buildMinimalRow(1, groupMax), { offers: [offer] });

      expect(detail.dates).toHaveLength(1);
      const date = detail.dates![0];

      expect(date.spotsLeft).toBe(expected.spotsLeft);
      if (expected.seatsTotal != null) {
        expect(date.seatsTotal).toBe(expected.seatsTotal);
      }

      const capacity = resolveYouTravelDepartureCapacity({ groupMax: detail.groupMax ?? groupMax }, date);
      expect(capacity).toEqual(expected.capacity);
      assertDepartureCapacityConsistent(expected.capacity, `${id} detail`);
    });
  });
});
