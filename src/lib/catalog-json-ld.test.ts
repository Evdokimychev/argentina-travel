import { describe, expect, it } from "vitest";
import {
  MAX_CATALOG_ITEM_LIST,
  buildDestinationsCatalogItemListJsonLd,
  buildPlacesCatalogItemListJsonLd,
  buildToursCatalogItemListJsonLd,
} from "@/lib/catalog-json-ld";
import type { TourListing } from "@/types";
import type { PlaceListing } from "@/types/place";
import type { DestinationPage } from "@/data/destination-pages";

function sampleTour(partial: Partial<TourListing> = {}): TourListing {
  return {
    id: partial.id ?? "t1",
    slug: partial.slug ?? "test-tour",
    title: partial.title ?? "Тестовый тур",
    shortDescription: partial.shortDescription ?? "Описание тура",
    image: partial.image ?? "/media/test.jpg",
    gallery: partial.gallery ?? [],
    destination: partial.destination ?? "Patagonia",
    region: partial.region ?? "Патагония",
    activityType: partial.activityType ?? "Авторские туры",
    durationDays: partial.durationDays ?? 5,
    durationNights: partial.durationNights ?? 4,
    durationBucket: partial.durationBucket ?? "4–7 дней",
    priceUsd: partial.priceUsd ?? 1000,
    accommodationType: partial.accommodationType ?? "Отель",
    comfortLevel: partial.comfortLevel ?? "Стандарт",
    difficultyLevel: partial.difficultyLevel ?? "Умеренная",
    language: partial.language ?? ["Русский"],
    childrenAllowed: partial.childrenAllowed ?? "Без ограничений",
    minimumAge: partial.minimumAge ?? 0,
    groupSizeMin: partial.groupSizeMin ?? 2,
    groupSizeMax: partial.groupSizeMax ?? 12,
    groupSizeBucket: partial.groupSizeBucket ?? "До 12 человек",
    availableDates: partial.availableDates ?? [],
    latitude: partial.latitude ?? -50,
    longitude: partial.longitude ?? -70,
    rating: partial.rating ?? 4.8,
    reviewCount: partial.reviewCount ?? 10,
    organizer: partial.organizer ?? { name: "Guide", avatar: "" },
    badges: partial.badges ?? [],
  };
}

function samplePlace(partial: Partial<PlaceListing> = {}): PlaceListing {
  return {
    id: partial.id ?? "p1",
    slug: partial.slug ?? "test-place",
    name: partial.name ?? "Тестовое место",
    shortDescription: partial.shortDescription ?? "Описание",
    coverImage: partial.coverImage ?? "",
    region: partial.region ?? "Патагония",
    province: partial.province ?? "Santa Cruz",
    city: partial.city ?? "",
    category: partial.category ?? "national_park",
    tags: partial.tags ?? ["природа"],
    latitude: partial.latitude ?? -50,
    longitude: partial.longitude ?? -70,
    popularity: partial.popularity ?? 10,
    season: partial.season ?? "круглый год",
  };
}

function sampleDestination(partial: Partial<DestinationPage> = {}): DestinationPage {
  return {
    id: partial.id ?? "patagonia",
    name: partial.name ?? "Патагония",
    region: partial.region ?? "Patagonia",
    description: partial.description ?? "Ледники и горы",
    image: partial.image ?? "/media/destinations/patagonia/cover.jpg",
    keywords: partial.keywords ?? ["ледники"],
    intro: partial.intro ?? "Регион ледников и гор.",
    highlights: partial.highlights ?? ["Perito Moreno"],
    bestSeason: partial.bestSeason ?? "октябрь–март",
    idealDuration: partial.idealDuration ?? "7–10 дней",
    howToGetThere: partial.howToGetThere ?? "Через El Calafate",
    travelTips: partial.travelTips ?? ["Бронируйте заранее"],
    regionGroup: partial.regionGroup ?? "Патагония",
  };
}

describe("buildToursCatalogItemListJsonLd", () => {
  it("builds Product items with locale-aware list name", () => {
    const jsonLd = buildToursCatalogItemListJsonLd([sampleTour()], "en");

    expect(jsonLd["@type"]).toBe("ItemList");
    expect(jsonLd.name).toBe("Argentina tours catalog");
    expect(jsonLd.numberOfItems).toBe(1);
    expect(jsonLd.itemListElement[0]?.item["@type"]).toBe("Product");
    expect(jsonLd.itemListElement[0]?.item.url).toContain("/tours/test-tour");
  });

  it("caps item count for payload size", () => {
    const tours = Array.from({ length: MAX_CATALOG_ITEM_LIST + 10 }, (_, index) =>
      sampleTour({ id: `t${index}`, slug: `tour-${index}` })
    );
    const jsonLd = buildToursCatalogItemListJsonLd(tours);

    expect(jsonLd.numberOfItems).toBe(MAX_CATALOG_ITEM_LIST + 10);
    expect(jsonLd.itemListElement).toHaveLength(MAX_CATALOG_ITEM_LIST);
  });
});

describe("buildPlacesCatalogItemListJsonLd", () => {
  it("builds TouristAttraction items", () => {
    const jsonLd = buildPlacesCatalogItemListJsonLd([samplePlace()], "en");

    expect(jsonLd.name).toBe("Places in Argentina");
    expect(jsonLd.itemListElement[0]?.item["@type"]).toBe("TouristAttraction");
    expect(jsonLd.itemListElement[0]?.item.url).toContain("/places/test-place");
  });
});

describe("buildDestinationsCatalogItemListJsonLd", () => {
  it("builds TouristDestination items", () => {
    const jsonLd = buildDestinationsCatalogItemListJsonLd([sampleDestination()], "en");

    expect(jsonLd.name).toBe("Regions & places");
    expect(jsonLd.itemListElement[0]?.item["@type"]).toBe("TouristDestination");
    expect(jsonLd.itemListElement[0]?.item.url).toContain("/destinations/patagonia");
  });
});
