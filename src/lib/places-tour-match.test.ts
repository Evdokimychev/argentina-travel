import { describe, expect, it } from "vitest";
import { matchToursForPlaceWithReasons } from "@/lib/places-tour-match";
import type { TourListing } from "@/types";
import type { PlaceDetail } from "@/types/place";

function listing(slug: string, overrides: Partial<TourListing>): TourListing {
  return {
    id: slug,
    slug,
    title: slug,
    shortDescription: "",
    destination: "Аргентина",
    region: "Аргентина",
    country: "Аргентина",
    activityType: "Экскурсионные туры",
    latitude: 0,
    longitude: 0,
    rating: 4.5,
    reviewCount: 0,
    partnerThematicTags: [],
    ...overrides,
  } as TourListing;
}

const place = {
  id: "el-fantasma",
  slug: "el-fantasma",
  name: "El Fantasma",
  shortDescription: "",
  fullDescription: "",
  category: "historic",
  region: "Корриентес",
  city: "Мерседес",
  province: "Корриентес",
  latitude: -29.18,
  longitude: -58.08,
  tags: ["история"],
  popularity: 1,
  gallery: [],
  source: "manual",
  relatedPlaces: [],
  collections: [],
  itineraryReferences: [],
} satisfies PlaceDetail;

describe("matchToursForPlaceWithReasons", () => {
  it("не считает совпадение короткого первого слова названием места", () => {
    const matches = matchToursForPlaceWithReasons(
      [
        listing("unrelated", {
          title: "El mercado Буэнос-Айреса",
          destination: "Буэнос-Айрес",
          region: "Буэнос-Айрес",
        }),
      ],
      place,
    );
    expect(matches).toEqual([]);
  });

  it("объясняет точное совпадение и близкую точку старта", () => {
    const matches = matchToursForPlaceWithReasons(
      [
        listing("exact", {
          title: "История El Fantasma",
          destination: "Мерседес",
          region: "Корриентес",
          latitude: -29.2,
          longitude: -58.05,
        }),
      ],
      place,
    );
    expect(matches[0]?.tour.slug).toBe("exact");
    expect(matches[0]?.reasons.join(" ")).toContain("El Fantasma");
  });
});
