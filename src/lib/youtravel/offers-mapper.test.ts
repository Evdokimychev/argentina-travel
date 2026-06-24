import { describe, expect, it } from "vitest";
import {
  mapYouTravelOffersToTourDates,
  normalizeYouTravelPartnerPrice,
  resolveYouTravelListingPriceFromOffers,
  resolveYouTravelPartnerPriceUsd,
} from "@/lib/youtravel/offers-mapper";

describe("normalizeYouTravelPartnerPrice", () => {
  it("relabels RUB-scale amounts mislabeled as USD", () => {
    expect(normalizeYouTravelPartnerPrice(37766.3, "usd")).toEqual({
      value: 37766.3,
      currency: "RUB",
    });
  });

  it("keeps normal USD amounts", () => {
    expect(normalizeYouTravelPartnerPrice(489, "USD")).toEqual({
      value: 489,
      currency: "USD",
    });
  });

  it("keeps RUB amounts unchanged", () => {
    expect(normalizeYouTravelPartnerPrice(750000, "RUB")).toEqual({
      value: 750000,
      currency: "RUB",
    });
  });
});

describe("resolveYouTravelPartnerPriceUsd", () => {
  it("converts mislabeled RUB-scale USD to realistic USD filter price", () => {
    const usd = resolveYouTravelPartnerPriceUsd(37766.3, "usd");
    expect(usd).not.toBeNull();
    expect(usd!).toBeGreaterThan(300);
    expect(usd!).toBeLessThan(600);
  });
});

describe("resolveYouTravelListingPriceFromOffers", () => {
  it("picks cheapest departure and maps discount to listing fields", () => {
    const result = resolveYouTravelListingPriceFromOffers(
      [
        {
          price_value: 450,
          price_currency: "USD",
          payload: { priceDiscountValue: 550 },
        },
        {
          price_value: 520,
          price_currency: "USD",
          payload: { priceDiscountValue: 600 },
        },
      ],
      { priceValue: 520, priceCurrency: "USD", priceUsd: 520 },
    );

    expect(result.partnerPriceValue).toBe(450);
    expect(result.partnerOriginalPriceValue).toBe(550);
    expect(result.priceUsd).toBe(450);
    expect(result.originalPriceUsd).toBe(550);
  });

  it("reads discount from offer payload when row price is empty", () => {
    const result = resolveYouTravelListingPriceFromOffers(
      [
        {
          price_value: null,
          price_currency: "USD",
          payload: {
            priceValue: 377200,
            priceDiscountValue: 410000,
            currency: "RUB",
          },
        },
      ],
      { priceValue: 410000, priceCurrency: "RUB", priceUsd: 4100 },
    );

    expect(result.partnerPriceValue).toBe(377200);
    expect(result.partnerOriginalPriceValue).toBe(410000);
    expect(result.originalPriceUsd).toBeGreaterThan(result.priceUsd!);
  });
});

describe("mapYouTravelOffersToTourDates", () => {
  it("maps departure discount to original and current partner prices", () => {
    const dates = mapYouTravelOffersToTourDates({
      tourId: 52537,
      offers: [
        {
          id: 1,
          startDate: "2026-03-01",
          endDate: "2026-03-10",
          priceValue: 450,
          priceDiscountValue: 550,
          currency: "USD",
          seatsAvailable: 5,
        },
      ],
      fallbackPriceUsd: 400,
    });

    expect(dates).toHaveLength(1);
    expect(dates[0].partnerPriceValue).toBe(450);
    expect(dates[0].partnerOriginalPriceValue).toBe(550);
    expect(dates[0].partnerPriceCurrency).toBe("USD");
  });

  it("reads price_discount_value snake_case field", () => {
    const dates = mapYouTravelOffersToTourDates({
      tourId: 1,
      offers: [
        {
          id: 2,
          startDate: "2026-04-01",
          priceValue: 300,
          price_discount_value: 400,
          currency: "EUR",
        },
      ],
      fallbackPriceUsd: 300,
    });

    expect(dates[0].partnerPriceValue).toBe(300);
    expect(dates[0].partnerOriginalPriceValue).toBe(400);
  });

  it("omits original price when discount equals current price", () => {
    const dates = mapYouTravelOffersToTourDates({
      tourId: 1,
      offers: [
        {
          id: 3,
          startDate: "2026-05-01",
          priceValue: 500,
          priceDiscountValue: 500,
          currency: "USD",
        },
      ],
      fallbackPriceUsd: 500,
    });

    expect(dates[0].partnerPriceValue).toBe(500);
    expect(dates[0].partnerOriginalPriceValue).toBeUndefined();
  });

  it("maps travelers going count from offer", () => {
    const dates = mapYouTravelOffersToTourDates({
      tourId: 55478,
      offers: [
        {
          id: 10,
          startDate: "2026-07-01",
          endDate: "2026-07-13",
          booked_spaces: 5,
          seatsTotal: 14,
          freeSpaces: 9,
          priceValue: 2000,
          currency: "USD",
        },
      ],
      fallbackPriceUsd: 2000,
    });

    expect(dates[0].travelersGoingCount).toBe(5);
    expect(dates[0].seatsTotal).toBe(14);
    expect(dates[0].spotsLeft).toBe(9);
  });
});

