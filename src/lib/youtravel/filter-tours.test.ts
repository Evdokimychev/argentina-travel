import { describe, expect, it } from "vitest";
import { filterTours, getDefaultFilters } from "@/lib/filter-tours";
import { isTripsterPartnerListing } from "@/lib/tripster/partner-tour-utils";
import { isYouTravelPartnerListing } from "@/lib/youtravel/partner-tour-utils";
import type { TourListing } from "@/types";

function stubListing(overrides: Partial<TourListing> & Pick<TourListing, "id" | "slug">): TourListing {
  return {
    title: "Тест",
    shortDescription: "",
    image: "/media/placeholders/tour-card.jpg",
    gallery: [],
    destination: "Буэнос-Айрес",
    region: "Аргентина",
    activityType: "Авторские туры",
    durationDays: 3,
    durationNights: 2,
    durationBucket: "2–3 дня",
    priceUsd: 100,
    accommodationType: "Отель",
    comfortLevel: "Стандарт",
    difficultyLevel: "Умеренная",
    language: ["Русский"],
    childrenAllowed: "Без ограничений",
    minimumAge: 0,
    groupSizeMin: 1,
    groupSizeMax: 8,
    groupSizeBucket: "До 8 человек",
    availableDates: [],
    latitude: -34.6,
    longitude: -58.4,
    rating: 0,
    reviewCount: 0,
    organizer: { name: "Гид", avatar: "", slug: "guide" },
    badges: [],
    ...overrides,
  };
}

describe("YouTravel catalog filters", () => {
  const youtravel = stubListing({
    id: "youtravel-1",
    slug: "patagonia-yt1",
    partnerSource: "youtravel",
    partnerPriceValue: 500,
    partnerPriceCurrency: "USD",
    availableDates: [{ start: "2026-07-10", end: "2026-07-15", spotsLeft: 4 }],
  });

  const tripster = stubListing({
    id: "tripster-1",
    slug: "tripster-tour",
    partnerSource: "tripster",
    availableDates: [],
  });

  it("filters YouTravel by availableDates", () => {
    const filters = {
      ...getDefaultFilters("USD", [youtravel]),
      dateFrom: new Date("2026-08-01"),
      dateTo: new Date("2026-08-31"),
    };
    expect(filterTours([youtravel], filters, "USD")).toHaveLength(0);
    expect(
      filterTours(
        [youtravel],
        {
          ...filters,
          dateFrom: new Date("2026-07-01"),
          dateTo: new Date("2026-07-31"),
        },
        "USD"
      )
    ).toHaveLength(1);
  });

  it("skips date filter for Tripster only", () => {
    const filters = {
      ...getDefaultFilters("USD", [tripster]),
      dateFrom: new Date("2026-08-01"),
      dateTo: new Date("2026-08-31"),
    };
    expect(filterTours([tripster], filters, "USD")).toHaveLength(1);
    expect(isTripsterPartnerListing(tripster)).toBe(true);
    expect(isYouTravelPartnerListing(youtravel)).toBe(true);
  });

  it("filters YouTravel by partner price in USD", () => {
    const filters = {
      ...getDefaultFilters("USD", [youtravel]),
      priceMin: 600,
      priceMax: 2000,
    };
    expect(filterTours([youtravel], filters, "USD")).toHaveLength(0);
    expect(
      filterTours(
        [youtravel],
        { ...filters, priceMin: 100, priceMax: 600 },
        "USD"
      )
    ).toHaveLength(1);
  });
});
