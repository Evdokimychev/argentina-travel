import { describe, expect, it } from "vitest";
import {
  getPlacePlanningFaq,
  getPlacePlanningHowToGetThere,
  withPlacePlanningDefaults,
} from "@/data/places-planning";
import { auditPlaceCatalogReadiness, placeListingQualityScore } from "@/lib/places-readiness";
import type { PlaceDetail } from "@/types/place";
import { PLACES_SEED } from "@/data/places-seed";
import { PLACES_KB_IMPORT } from "@/data/places-kb-import.generated";
import { fetchPlaceBySlugServer } from "@/lib/places-repository";

function readyPlace(patch: Partial<PlaceDetail> = {}): PlaceDetail {
  const listing = withPlacePlanningDefaults({
    id: "place-test",
    slug: "test-place",
    name: "Тестовое место",
    shortDescription: "Практическое описание места для планирования поездки по Аргентине.",
    fullDescription:
      "Подробное описание места с понятной логистикой, сезоном и контекстом для самостоятельной поездки по Аргентине.",
    category: "national_park",
    region: "Патагония",
    province: "Santa Cruz",
    latitude: -46,
    longitude: -70,
    coverImage: "/media/places/test/hero.jpg",
    gallery: ["/media/places/test/hero.jpg"],
    tags: ["природа", "треккинг", "парк"],
    popularity: 50,
    source: "manual" as const,
    relatedPlaces: [],
    collections: [],
    itineraryReferences: [],
    ...patch,
  });
  return {
    ...listing,
    howToGetThere: patch.howToGetThere ?? getPlacePlanningHowToGetThere(listing),
    faq: patch.faq ?? getPlacePlanningFaq(listing),
  };
}

describe("places readiness", () => {
  it("adds cautious planning defaults without inventing a changing price", () => {
    const place = readyPlace();
    expect(place.season).toContain("Ноябрь");
    expect(place.visitDuration).toBe("Полный день");
    expect(place.howToGetThere).toContain("проверяйте перед выездом");
    expect(place.faq).toHaveLength(3);
    expect(place.ticketPrice).toBeUndefined();
  });

  it("reports critical publication gaps for admin review", () => {
    const broken = readyPlace({
      slug: "broken",
      region: "Неизвестный регион",
      coverImage: undefined,
      gallery: [],
      latitude: 0,
      longitude: 0,
    });
    const report = auditPlaceCatalogReadiness([broken]);
    expect(report.needsReview).toBe(1);
    expect(report.issues.filter((issue) => issue.severity === "critical").map((issue) => issue.field))
      .toEqual(expect.arrayContaining(["region", "coordinates", "coverImage", "gallery"]));
  });

  it("raises map quality when practical content and media are present", () => {
    expect(placeListingQualityScore(readyPlace())).toBeGreaterThanOrEqual(85);
  });

  it("keeps the complete public places catalog publication-ready", async () => {
    const details = await Promise.all(
      [...PLACES_SEED, ...PLACES_KB_IMPORT].map((place) => fetchPlaceBySlugServer(place.slug)),
    );
    const report = auditPlaceCatalogReadiness(
      details.filter((place): place is PlaceDetail => place !== null),
    );
    expect(report.total).toBe(PLACES_SEED.length + PLACES_KB_IMPORT.length);
    expect(report.issues).toEqual([]);
    expect(report.ready).toBe(report.total);
  });
});
