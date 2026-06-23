import { describe, expect, it } from "vitest";
import { mergeMarketplaceTourListings } from "@/lib/tripster/partner-tour-utils";
import { buildYouTravelTourSlug } from "@/lib/youtravel/partner-tour-utils";
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

describe("YouTravel marketplace slugs", () => {
  it("buildYouTravelTourSlug appends -yt{id} suffix", () => {
    expect(buildYouTravelTourSlug("Патагония", 42)).toBe("patagoniya-yt42");
  });

  it("mergeMarketplaceTourListings prefers platform slug on collision", () => {
    const platform = [stubListing({ id: "platform-1", slug: "patagonia" })];
    const youtravel = [
      stubListing({
        id: "youtravel-42",
        slug: "patagonia",
        partnerSource: "youtravel",
      }),
    ];

    const merged = mergeMarketplaceTourListings(platform, youtravel);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.id).toBe("platform-1");
  });
});
