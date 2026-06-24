import { describe, expect, it } from "vitest";
import {
  buildYouTravelBookingConditions,
  resolveYouTravelCancellationSummary,
} from "@/lib/youtravel/booking-conditions";
import type { PartnerTourContent } from "@/lib/tripster/partner-tour-content";
import type { TourDetail } from "@/types";

const baseTour = {
  partnerSource: "youtravel",
  partnerPriceValue: 1000,
  partnerPriceCurrency: "USD",
  partnerPriceUnit: "per_person",
  dates: [{ id: "d1", partnerPrepayPercent: 30 }],
} as TourDetail;

const baseContent = {
  instantBooking: true,
  tourGuaranteed: true,
  importantToKnowItems: [
    {
      title: "Условия отмены",
      html: "<ul><li>отмена в течение 24 часов — полный возврат</li><li>позже — возврат за вычетом 15%</li></ul>",
    },
  ],
} as PartnerTourContent;

describe("resolveYouTravelCancellationSummary", () => {
  it("joins first two cancellation bullets into a short summary", () => {
    expect(resolveYouTravelCancellationSummary(baseContent)).toBe(
      "отмена в течение 24 часов — полный возврат; позже — возврат за вычетом 15%",
    );
  });
});

describe("buildYouTravelBookingConditions", () => {
  it("includes prepayment, guarantee, instant booking and cancellation", () => {
    const items = buildYouTravelBookingConditions({
      tour: baseTour,
      content: baseContent,
      guests: 1,
      totalPriceUsd: 1000,
    });

    expect(items.map((item) => item.kind)).toEqual([
      "prepayment",
      "guarantee",
      "instantBooking",
      "cancellation",
    ]);
    expect(items[0]?.text).toContain("30%");
    expect(items[2]?.text).toContain("Моментальное бронирование");
  });
});
