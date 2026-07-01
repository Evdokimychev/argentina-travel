import { describe, expect, it } from "vitest";
import { getAllPlaceListings } from "@/data/places-seed";
import { matchCatalogPlacesForTour } from "@/lib/tour-place-match";
import type { TourDetail } from "@/types";

function minimalTour(overrides: Partial<TourDetail> = {}): TourDetail {
  return {
    id: "tour-1",
    slug: "patagonia-glaciers",
    title: "Патагония: ледники и El Calafate",
    country: "Аргентина",
    region: "Патагония",
    durationDays: 7,
    durationNights: 6,
    priceUsd: 1200,
    rating: 4.8,
    reviewCount: 12,
    gallery: [],
    image: "/images/placeholder-tour.jpg",
    shortDescription: "Маршрут через El Calafate и ледник Перито-Морено",
    difficulty: "Средняя",
    comfort: "Стандарт",
    groupMin: 2,
    groupMax: 12,
    places: [{ id: "p1", title: "Ледник Перито-Морено", description: "", image: "" }],
    routePoints: [{ id: "rp1", name: "El Calafate", lat: -50.3, lng: -72.3 }],
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
    tags: ["Патагония", "ледники"],
    ...overrides,
  };
}

describe("matchCatalogPlacesForTour", () => {
  const catalog = getAllPlaceListings();

  it("matches Patagonia tour to El Calafate and Perito Moreno places", () => {
    const matched = matchCatalogPlacesForTour(minimalTour(), catalog);
    const slugs = matched.map((place) => place.slug);

    expect(slugs).toContain("el-calafate");
    expect(slugs).toContain("perito-moreno-glacier");
    expect(matched.length).toBeGreaterThan(0);
    expect(matched.length).toBeLessThanOrEqual(6);
  });

  it("returns empty array for empty catalog", () => {
    expect(matchCatalogPlacesForTour(minimalTour(), [])).toEqual([]);
  });
});
