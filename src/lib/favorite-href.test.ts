import { describe, expect, it } from "vitest";
import { favoriteHref } from "@/lib/favorite-href";
import type { FavoriteTour } from "@/types/tourist";

function favorite(partial: Partial<FavoriteTour>): FavoriteTour {
  return {
    tourId: "1",
    tourSlug: "sample",
    tourTitle: "Sample",
    tourImage: "",
    addedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("favoriteHref", () => {
  it("links places to the places catalog detail page", () => {
    expect(
      favoriteHref(
        favorite({
          kind: "place",
          tourSlug: "el-calafate",
        }),
      ),
    ).toBe("/places/el-calafate");
  });

  it("links excursions and tours to their catalogs", () => {
    expect(favoriteHref(favorite({ kind: "excursion", tourSlug: "ba-walk" }))).toBe(
      "/excursions/ba-walk",
    );
    expect(favoriteHref(favorite({ kind: "tour", tourSlug: "patagonia" }))).toBe("/tours/patagonia");
    expect(favoriteHref(favorite({ tourSlug: "patagonia" }))).toBe("/tours/patagonia");
  });
});
