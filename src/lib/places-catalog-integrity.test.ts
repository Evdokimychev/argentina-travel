import { describe, expect, it } from "vitest";
import {
  COLLECTIONS_SEED,
  ITINERARIES_SEED,
  PLACES_SEED,
} from "@/data/places-seed";
import { PLACE_CATEGORIES } from "@/types/place";
import { getPlaceCoverImage, MEDIA_LOGO_FALLBACK } from "@/lib/media-resolver";

const slugs = new Set(PLACES_SEED.map((p) => p.slug));

describe("Places catalog integrity", () => {
  it("has no duplicate slugs", () => {
    expect(slugs.size).toBe(PLACES_SEED.length);
  });

  it("has no duplicate ids", () => {
    const ids = new Set(PLACES_SEED.map((p) => p.id));
    expect(ids.size).toBe(PLACES_SEED.length);
  });

  it("has no two places sharing identical coordinates", () => {
    const coords = new Set(PLACES_SEED.map((p) => `${p.latitude}:${p.longitude}`));
    expect(coords.size).toBe(PLACES_SEED.length);
  });

  it("has no duplicate place names (cities vs attractions stay distinct)", () => {
    const names = new Set(PLACES_SEED.map((p) => p.name.trim().toLowerCase()));
    expect(names.size).toBe(PLACES_SEED.length);
  });

  it("keeps all coordinates inside Argentina's bounding box", () => {
    for (const place of PLACES_SEED) {
      expect(place.latitude, place.slug).toBeLessThan(-21);
      expect(place.latitude, place.slug).toBeGreaterThan(-56);
      expect(place.longitude, place.slug).toBeLessThan(-53);
      expect(place.longitude, place.slug).toBeGreaterThan(-74);
    }
  });

  it("uses valid categories and required editorial fields", () => {
    for (const place of PLACES_SEED) {
      expect(PLACE_CATEGORIES, place.slug).toContain(place.category);
      expect(place.region.trim().length, place.slug).toBeGreaterThan(0);
      expect(place.shortDescription.trim().length, place.slug).toBeGreaterThan(0);
      expect(place.fullDescription.trim().length, place.slug).toBeGreaterThan(40);
    }
  });

  it("never renders the logo placeholder as a place cover", () => {
    for (const place of PLACES_SEED) {
      expect(getPlaceCoverImage(place.slug), place.slug).not.toBe(MEDIA_LOGO_FALLBACK);
    }
  });

  it("resolves every collection place slug to a real place", () => {
    for (const collection of COLLECTIONS_SEED) {
      expect(collection.placeSlugs.length, collection.slug).toBeGreaterThan(0);
      for (const slug of collection.placeSlugs) {
        expect(slugs.has(slug), `${collection.slug} → ${slug}`).toBe(true);
      }
    }
  });

  it("resolves every itinerary stop place slug to a real place", () => {
    for (const itinerary of ITINERARIES_SEED) {
      for (const stop of itinerary.stops) {
        if (!stop.placeSlug) continue;
        expect(slugs.has(stop.placeSlug), `${itinerary.slug} → ${stop.placeSlug}`).toBe(true);
      }
    }
  });

  it("has unique collection and itinerary slugs", () => {
    const collectionSlugs = new Set(COLLECTIONS_SEED.map((c) => c.slug));
    expect(collectionSlugs.size).toBe(COLLECTIONS_SEED.length);
    const itinerarySlugs = new Set(ITINERARIES_SEED.map((i) => i.slug));
    expect(itinerarySlugs.size).toBe(ITINERARIES_SEED.length);
  });
});
