import { describe, expect, it } from "vitest";
import {
  applyYouTravelOfferPricesToListing,
  rowToListing,
  type YouTravelTourRow,
} from "@/lib/youtravel/partner-tour-repository";

function baseRow(overrides: Partial<YouTravelTourRow> = {}): YouTravelTourRow {
  return {
    id: 66646,
    slug: "bolshoy-tur-po-patagonii-komfort-format-yt66646",
    title: "Большой тур по Патагонии",
    country: "Аргентина",
    region: "Патагония",
    city: "Эль-Калафате",
    status: "published",
    duration_days: 10,
    duration_nights: 9,
    rating: 4.8,
    review_count: 12,
    price_value: null,
    price_currency: null,
    price_display: null,
    youtravel_url: "https://youtravel.me/tours/66646",
    partner_url: null,
    cover_image: null,
    photos: null,
    payload: {
      priceFrom: 2890,
      currency: "USD",
    } as YouTravelTourRow["payload"],
    ...overrides,
  };
}

describe("YouTravel catalog price mapping", () => {
  it("reads payload price when tour row price columns are empty", () => {
    const listing = rowToListing(baseRow());
    expect(listing.partnerPriceValue).toBe(2890);
    expect(listing.partnerPriceCurrency).toBe("USD");
    expect(listing.priceUsd).toBe(2890);
    expect(listing.partnerPriceDisplay).toMatch(/2[\s\u00a0]?890/);
  });

  it("prefers cheapest offer sale price for catalog cards", () => {
    const listing = applyYouTravelOfferPricesToListing(rowToListing(baseRow()), [
      {
        price_value: 3100,
        price_currency: "USD",
        payload: {},
      },
      {
        price_value: 2650,
        price_currency: "USD",
        payload: {},
      },
    ]);

    expect(listing.partnerPriceValue).toBe(2650);
    expect(listing.priceUsd).toBe(2650);
    expect(listing.partnerPriceDisplay).toMatch(/2[\s\u00a0]?650/);
  });
});
