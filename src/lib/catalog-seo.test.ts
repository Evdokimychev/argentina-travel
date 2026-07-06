import { describe, expect, it } from "vitest";
import { buildCatalogMetadata } from "@/lib/catalog-seo";
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

describe("buildCatalogMetadata", () => {
  const tours = [
    stubListing({ id: "t1", slug: "patagonia", region: "Патагония" }),
    stubListing({ id: "t2", slug: "other", region: "Буэнос-Айрес" }),
  ];

  it("indexes clean catalog URL", () => {
    const meta = buildCatalogMetadata({}, tours);
    expect(meta.robots).toBeUndefined();
    expect(meta.alternates?.canonical).toBe("/tours");
  });

  it("noindexes filtered catalog URLs and keeps clean canonical", () => {
    const meta = buildCatalogMetadata({ query: "патагония" }, tours);
    expect(meta.robots).toEqual({ index: false, follow: true });
    expect(meta.alternates?.canonical).toBe("/tours");
  });
});
