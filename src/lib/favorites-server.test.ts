import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/tours-server", () => ({
  fetchTourDetail: vi.fn(),
}));

vi.mock("@/lib/excursion-server", () => ({
  fetchExcursionDetailServer: vi.fn(),
}));

vi.mock("@/lib/cms/place-resolver", () => ({
  resolvePlacePage: vi.fn(),
}));

import { fetchTourDetail } from "@/lib/tours-server";
import { fetchExcursionDetailServer } from "@/lib/excursion-server";
import { resolvePlacePage } from "@/lib/cms/place-resolver";
import {
  hydrateUserFavorites,
  parseFavoriteItemInput,
} from "@/lib/favorites-server";

describe("parseFavoriteItemInput", () => {
  it("accepts place favorites", () => {
    expect(
      parseFavoriteItemInput({
        itemType: "place",
        itemId: "el-calafate",
        itemSlug: "el-calafate",
      }),
    ).toEqual({
      itemType: "place",
      itemId: "el-calafate",
      itemSlug: "el-calafate",
    });
  });

  it("rejects unknown item types", () => {
    expect(
      parseFavoriteItemInput({
        itemType: "blog",
        itemSlug: "sample",
      }),
    ).toBeNull();
  });
});

describe("hydrateUserFavorites", () => {
  it("hydrates place favorites with resolver data", async () => {
    vi.mocked(resolvePlacePage).mockResolvedValue({
      id: "el-calafate",
      slug: "el-calafate",
      name: "Эль-Калафате",
      coverImage: "/images/el-calafate.jpg",
      region: "Патагония",
      shortDescription: "",
      category: "city",
      latitude: 0,
      longitude: 0,
      tags: [],
      popularity: 1,
      fullDescription: "",
      gallery: [],
      source: "manual",
      relatedPlaces: [],
      collections: [],
      itineraryReferences: [],
    });

    const [favorite] = await hydrateUserFavorites([
      {
        user_id: "user-1",
        item_type: "place",
        item_id: "el-calafate",
        item_slug: "el-calafate",
        created_at: "2026-06-01T00:00:00.000Z",
      },
    ]);

    expect(favorite).toMatchObject({
      kind: "place",
      tourSlug: "el-calafate",
      tourTitle: "Эль-Калафате",
      tourImage: "/images/el-calafate.jpg",
      region: "Патагония",
    });
  });

  it("returns slug stub when place is missing", async () => {
    vi.mocked(resolvePlacePage).mockResolvedValue(null);

    const [favorite] = await hydrateUserFavorites([
      {
        user_id: "user-1",
        item_type: "place",
        item_id: "deleted-place",
        item_slug: "deleted-place",
        created_at: "2026-06-01T00:00:00.000Z",
      },
    ]);

    expect(favorite).toMatchObject({
      kind: "place",
      tourSlug: "deleted-place",
      tourTitle: "deleted-place",
      tourImage: "",
    });
  });

  it("still hydrates tours and excursions", async () => {
    vi.mocked(fetchTourDetail).mockResolvedValue({
      title: "Patagonia",
      image: "/tour.jpg",
      region: "Patagonia",
      country: "Argentina",
      priceUsd: 100,
    } as Awaited<ReturnType<typeof fetchTourDetail>>);

    vi.mocked(fetchExcursionDetailServer).mockResolvedValue({
      title: "City walk",
      coverImage: "/excursion.jpg",
      cityName: "Buenos Aires",
    } as Awaited<ReturnType<typeof fetchExcursionDetailServer>>);

    const favorites = await hydrateUserFavorites([
      {
        user_id: "user-1",
        item_type: "tour",
        item_id: "tour-1",
        item_slug: "patagonia",
        created_at: "2026-06-02T00:00:00.000Z",
      },
      {
        user_id: "user-1",
        item_type: "excursion",
        item_id: "123",
        item_slug: "city-walk",
        created_at: "2026-06-01T00:00:00.000Z",
      },
    ]);

    expect(favorites[0]?.kind).toBe("tour");
    expect(favorites[1]?.kind).toBe("excursion");
  });
});
