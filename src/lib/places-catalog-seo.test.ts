import { describe, expect, it } from "vitest";
import { buildPlacesCatalogPageMetadata, getServerPlacesCatalogView, hasActivePlaceCatalogFilters } from "@/lib/places-catalog-seo";
import type { PlaceListing } from "@/types/place";

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
    rating: partial.rating,
    season: partial.season ?? "круглый год",
  };
}

describe("getServerPlacesCatalogView", () => {
  const places = [
    samplePlace({ id: "1", slug: "patagonia", region: "Патагония", category: "national_park" }),
    samplePlace({ id: "2", slug: "ba", region: "Буэнос-Айрес", category: "city" }),
  ];

  it("filters by region", () => {
    const view = getServerPlacesCatalogView({ region: "Патагония" }, places);
    expect(view.filtered).toHaveLength(1);
    expect(view.filtered[0]?.slug).toBe("patagonia");
  });
});

describe("buildPlacesCatalogPageMetadata", () => {
  const places = [samplePlace(), samplePlace({ id: "2", slug: "other" })];

  it("indexes clean catalog URL", () => {
    const meta = buildPlacesCatalogPageMetadata({}, places);
    expect(meta.robots).toBeUndefined();
    expect(meta.title).toContain("Места Аргентины");
  });

  it("includes places hero OG image", () => {
    const meta = buildPlacesCatalogPageMetadata({}, places);
    const ogImages = meta.openGraph?.images;
    const ogImage = Array.isArray(ogImages) ? ogImages[0] : ogImages;
    expect(ogImage).toBeDefined();
    const ogUrl =
      typeof ogImage === "string"
        ? ogImage
        : ogImage instanceof URL
          ? ogImage.toString()
          : ogImage?.url;
    expect(ogUrl).toMatch(/\/media\//);

    const twitterImages = meta.twitter?.images;
    const twitterImage = Array.isArray(twitterImages) ? twitterImages[0] : twitterImages;
    const twitterUrl =
      typeof twitterImage === "string"
        ? twitterImage
        : twitterImage instanceof URL
          ? twitterImage.toString()
          : twitterImage?.url;
    expect(twitterUrl).toMatch(/\/media\//);
  });

  it("noindexes filtered catalog URLs", () => {
    const meta = buildPlacesCatalogPageMetadata({ region: "Патагония" }, places);
    expect(meta.robots).toEqual({ index: false, follow: true });
    expect(meta.title).toContain("Патагония");
  });
});

describe("hasActivePlaceCatalogFilters", () => {
  it("detects active filters", () => {
    expect(hasActivePlaceCatalogFilters({})).toBe(false);
    expect(hasActivePlaceCatalogFilters({ region: "Патагония" })).toBe(true);
  });
});
