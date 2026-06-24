import { describe, expect, it } from "vitest";
import {
  computeYouTravelPrepaymentAmount,
  formatYouTravelPrepaymentAdvantage,
  mapYouTravelPrepaymentFields,
  resolveYouTravelPrepaymentFromOffer,
  resolveYouTravelPrepaymentSummary,
} from "@/lib/youtravel/prepayment";

describe("YouTravel prepayment", () => {
  it("reads percent prepayment from partner offer payload", () => {
    expect(
      resolveYouTravelPrepaymentFromOffer({
        prepay_value: 15,
        prepay_value_cur: "%",
      }),
    ).toEqual({ percent: 15 });
  });

  it("maps prepayment fields onto tour dates", () => {
    expect(
      mapYouTravelPrepaymentFields({
        prepay_value: 15,
        prepay_value_cur: "%",
      }),
    ).toEqual({ partnerPrepayPercent: 15 });
  });

  it("formats prepayment advantage with amount and percent", () => {
    const line = formatYouTravelPrepaymentAdvantage({
      tour: {
        partnerSource: "youtravel",
        partnerPriceValue: 3400,
        partnerPriceCurrency: "USD",
        partnerPriceUnit: "per_person",
        dates: [
          {
            id: "yt-offer-1",
            startDate: "2027-01-03",
            endDate: "2027-01-15",
            spotsLeft: 4,
            priceUsd: 3400,
            partnerPriceValue: 3400,
            partnerPriceCurrency: "USD",
            partnerPrepayPercent: 15,
          },
        ],
      },
      selectedDate: {
        id: "yt-offer-1",
        startDate: "2027-01-03",
        endDate: "2027-01-15",
        spotsLeft: 4,
        priceUsd: 3400,
        partnerPriceValue: 3400,
        partnerPriceCurrency: "USD",
        partnerPrepayPercent: 15,
      },
      guests: 1,
      totalPriceUsd: 3400,
    });

    expect(line).toContain("510");
    expect(line).toContain("(15%)");
    expect(line).toMatch(/^Предоплата при бронировании:/);
  });

  it("computes prepayment amount from total and percent", () => {
    expect(computeYouTravelPrepaymentAmount({ percent: 15 }, 3400)).toBe(510);
  });

  it("builds prepayment summary for booking panel", () => {
    const summary = resolveYouTravelPrepaymentSummary({
      tour: {
        partnerSource: "youtravel",
        partnerPriceValue: 3400,
        partnerPriceCurrency: "USD",
        partnerPriceUnit: "per_person",
        priceFromPrefix: true,
        dates: [
          {
            id: "yt-offer-1",
            startDate: "2027-02-22",
            endDate: "2027-03-06",
            spotsLeft: 4,
            priceUsd: 3400,
            partnerPriceValue: 3400,
            partnerPriceCurrency: "USD",
            partnerPrepayPercent: 15,
          },
        ],
      },
      selectedDate: {
        id: "yt-offer-1",
        startDate: "2027-02-22",
        endDate: "2027-03-06",
        spotsLeft: 4,
        priceUsd: 3400,
        partnerPriceValue: 3400,
        partnerPriceCurrency: "USD",
        partnerPrepayPercent: 15,
      },
      guests: 1,
      totalPriceUsd: 3400,
    });

    expect(summary?.title).toContain("510");
    expect(summary?.title).toContain("(15%)");
    expect(summary?.description).toContain("Остаток можно оплатить позже");
  });
});
