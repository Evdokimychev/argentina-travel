import { describe, expect, it } from "vitest";
import {
  normalizeSlugList,
  parseContentSlugList,
  resolvePlaceListingsBySlugs,
  resolveRelatedPlacesForTour,
  resolveRelatedToursForPlace,
  resolveTourListingsBySlugs,
} from "@/lib/cms-content-cross-links";
import { getAllPlaceListings } from "@/data/places-seed";
import type { TourDetail, TourListing } from "@/types";
import type { PlaceDetail } from "@/types/place";

function minimalTour(overrides: Partial<TourDetail> = {}): TourDetail {
  return {
    id: "tour-1",
    slug: "patagonia-glaciers",
    title: "Патагония",
    country: "Аргентина",
    region: "Патагония",
    durationDays: 7,
    durationNights: 6,
    priceUsd: 1200,
    rating: 4.8,
    reviewCount: 12,
    gallery: [],
    image: "/images/placeholder-tour.jpg",
    shortDescription: "",
    difficulty: "Средняя",
    comfort: "Стандарт",
    groupMin: 2,
    groupMax: 12,
    places: [],
    descriptionBlocks: [],
    itinerary: [],
    organizerComment: { greeting: "", recommendations: [], routeNotes: "" },
    organizer: {
      id: "org-1",
      slug: "test",
      name: "Test",
      role: "Organizer",
      avatar: "",
      rating: 5,
      reviewCount: 0,
      tourCount: 1,
      travelerCount: 10,
      languages: ["ru"],
      experienceYears: 5,
      phone: "",
      email: "",
    },
    reviews: [],
    accommodations: [],
    included: [],
    excluded: [],
    arrival: { airports: [], flights: [], transfers: [], meetingPoint: "" },
    importantInfo: [],
    faq: [],
    dates: [],
    tags: [],
    ...overrides,
  };
}

const sampleTours: TourListing[] = [
  {
    id: "t1",
    slug: "patagonia-glaciers",
    title: "Патагония",
    shortDescription: "",
    region: "Патагония",
    destination: "El Calafate",
    durationDays: 7,
    durationNights: 6,
    priceUsd: 1200,
    image: "/x.jpg",
    gallery: [],
    rating: 4.8,
    reviewCount: 1,
    activityType: "Треккинг",
    comfortLevel: "Стандарт",
    badges: [],
    latitude: -50,
    longitude: -72,
    bookingMode: "scheduled",
  },
  {
    id: "t2",
    slug: "buenos-aires-weekend",
    title: "Буэнос-Айрес",
    shortDescription: "",
    region: "Buenos Aires",
    destination: "Buenos Aires",
    durationDays: 3,
    durationNights: 2,
    priceUsd: 400,
    image: "/y.jpg",
    gallery: [],
    rating: 4.5,
    reviewCount: 2,
    activityType: "Экскурсионные туры",
    comfortLevel: "Стандарт",
    badges: [],
    latitude: -34,
    longitude: -58,
    bookingMode: "scheduled",
  },
] as unknown as TourListing[];

describe("cms-content-cross-links", () => {
  it("parseContentSlugList dedupes and trims", () => {
    expect(parseContentSlugList(" a, b , a\nC ")).toEqual(["a", "b", "c"]);
  });

  it("normalizeSlugList preserves order", () => {
    expect(normalizeSlugList(["B", "a", "b"])).toEqual(["b", "a"]);
  });

  it("resolveTourListingsBySlugs maps slugs to listings", () => {
    const resolved = resolveTourListingsBySlugs(sampleTours, [
      "buenos-aires-weekend",
      "missing",
      "patagonia-glaciers",
    ]);
    expect(resolved.map((tour) => tour.slug)).toEqual([
      "buenos-aires-weekend",
      "patagonia-glaciers",
    ]);
  });

  it("resolvePlaceListingsBySlugs maps slugs to catalog entries", () => {
    const catalog = getAllPlaceListings();
    const resolved = resolvePlaceListingsBySlugs(catalog, ["el-calafate", "unknown"]);
    expect(resolved.map((place) => place.slug)).toEqual(["el-calafate"]);
  });

  it("resolveRelatedToursForPlace prefers explicit CMS slugs", () => {
    const place = {
      slug: "el-calafate",
      name: "El Calafate",
      region: "Патагония",
      relatedTourSlugs: ["buenos-aires-weekend"],
    } satisfies Pick<PlaceDetail, "slug" | "name" | "region" | "relatedTourSlugs">;

    const resolved = resolveRelatedToursForPlace(place, sampleTours);
    expect(resolved.map((tour) => tour.slug)).toEqual(["buenos-aires-weekend"]);
  });

  it("resolveRelatedPlacesForTour prefers explicit slugs over heuristic", () => {
    const tour = minimalTour({ relatedPlaceSlugs: ["buenos-aires"] });

    const catalog = getAllPlaceListings();
    const resolved = resolveRelatedPlacesForTour(tour, catalog);
    expect(resolved.map((place) => place.slug)).toEqual(["buenos-aires"]);
  });
});
