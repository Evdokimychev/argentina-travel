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

  it("skips date filter for Tripster without catalog dates", () => {
    const filters = {
      ...getDefaultFilters("USD", [tripster]),
      dateFrom: new Date("2026-08-01"),
      dateTo: new Date("2026-08-31"),
    };
    expect(filterTours([tripster], filters, "USD")).toHaveLength(1);
    expect(isTripsterPartnerListing(tripster)).toBe(true);
    expect(isYouTravelPartnerListing(youtravel)).toBe(true);
  });

  it("filters Tripster by availableDates when catalog dates are present", () => {
    const tripsterWithDates = {
      ...tripster,
      availableDates: [{ start: "2026-07-10", end: "2026-07-15", spotsLeft: 4 }],
    };
    const filters = {
      ...getDefaultFilters("USD", [tripsterWithDates]),
      dateFrom: new Date("2026-08-01"),
      dateTo: new Date("2026-08-31"),
    };

    expect(filterTours([tripsterWithDates], filters, "USD")).toHaveLength(0);
    expect(
      filterTours(
        [tripsterWithDates],
        {
          ...filters,
          dateFrom: new Date("2026-07-01"),
          dateTo: new Date("2026-07-31"),
        },
        "USD",
      ),
    ).toHaveLength(1);
  });

  it("filters Tripster by priceUsd in selected currency", () => {
    const expensive = { ...tripster, priceUsd: 3500 };
    const filters = {
      ...getDefaultFilters("RUB", [expensive]),
      priceMin: 5_628,
      priceMax: 26_188,
    };
    expect(filterTours([expensive], filters, "RUB")).toHaveLength(0);
    expect(
      filterTours(
        [expensive],
        { ...filters, priceMin: 0, priceMax: 500_000 },
        "RUB"
      )
    ).toHaveLength(1);
  });

  it("filters Tripster by RUB partner price", () => {
    const expensive = {
      ...tripster,
      priceUsd: 0,
      priceOnRequest: true,
      partnerPriceValue: 300_000,
      partnerPriceCurrency: "RUB",
    };
    const filters = {
      ...getDefaultFilters("RUB", [expensive]),
      priceMin: 5_628,
      priceMax: 26_188,
    };
    expect(filterTours([expensive], filters, "RUB")).toHaveLength(0);
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

  it("filters by instant booking when instantBookingOnly is active", () => {
    const instant = { ...youtravel, partnerInstantBooking: true };
    const regular = { ...youtravel, id: "youtravel-2", slug: "patagonia-yt2" };
    const native = stubListing({ id: "native-1", slug: "native-tour" });
    const filters = {
      ...getDefaultFilters("USD", [instant, regular, native]),
      instantBookingOnly: true,
    };

    const result = filterTours([instant, regular, native], filters, "USD");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("youtravel-1");
  });

  it("filters YouTravel by comfort level", () => {
    const premium = { ...youtravel, comfortLevel: "Премиум" as const };
    const standard = {
      ...youtravel,
      id: "youtravel-2",
      slug: "patagonia-yt2",
      comfortLevel: "Стандарт" as const,
    };
    const filters = {
      ...getDefaultFilters("USD", [premium, standard]),
      comfortLevels: ["Премиум" as const],
    };

    const result = filterTours([premium, standard], filters, "USD");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("youtravel-1");
  });

  it("filters YouTravel by difficulty level", () => {
    const intense = { ...youtravel, difficultyLevel: "Высокая" as const };
    const moderate = {
      ...youtravel,
      id: "youtravel-2",
      slug: "patagonia-yt2",
      difficultyLevel: "Умеренная" as const,
    };
    const filters = {
      ...getDefaultFilters("USD", [intense, moderate]),
      difficultyLevels: ["Высокая" as const],
    };

    const result = filterTours([intense, moderate], filters, "USD");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("youtravel-1");
  });

  it("filters Tripster by comfort level", () => {
    const tripsterComfort = {
      ...tripster,
      comfortLevel: "Базовый" as const,
    };
    const filters = {
      ...getDefaultFilters("USD", [tripsterComfort]),
      comfortLevels: ["Премиум" as const],
    };

    expect(filterTours([tripsterComfort], filters, "USD")).toHaveLength(0);
    expect(
      filterTours(
        [tripsterComfort],
        { ...filters, comfortLevels: ["Базовый" as const] },
        "USD"
      )
    ).toHaveLength(1);
  });

  it("filters partner tours by accommodation and language", () => {
    const filters = {
      ...getDefaultFilters("USD", [youtravel, tripster]),
      accommodations: ["Палатка" as const],
    };
    expect(filterTours([youtravel, tripster], filters, "USD")).toHaveLength(0);

    const englishOnly = {
      ...getDefaultFilters("USD", [youtravel]),
      languages: ["Английский" as const],
    };
    expect(filterTours([youtravel], englishOnly, "USD")).toHaveLength(0);
    expect(
      filterTours([youtravel], { ...englishOnly, languages: ["Русский" as const] }, "USD")
    ).toHaveLength(1);
  });

  it("filters YouTravel by organizer slug", () => {
    const expertTour = {
      ...youtravel,
      organizerOwnerId: "youtravel-expert-51497",
      organizer: { name: "Мария", avatar: "", slug: "youtravel-expert-51497" },
    };
    const otherTour = {
      ...youtravel,
      id: "youtravel-2",
      slug: "other-yt2",
      organizerOwnerId: "youtravel-expert-999",
      organizer: { name: "Другой", avatar: "", slug: "youtravel-expert-999" },
    };
    const filters = {
      ...getDefaultFilters("USD", [expertTour, otherTour]),
      organizerSlug: "youtravel-expert-51497",
    };

    const result = filterTours([expertTour, otherTour], filters, "USD");
    expect(result).toHaveLength(1);
    expect(result[0]?.organizerOwnerId).toBe("youtravel-expert-51497");
  });
});
