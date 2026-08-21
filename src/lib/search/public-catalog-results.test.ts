import { describe, expect, it } from "vitest";
import { filterSearchHitsByPublicCatalog } from "@/lib/search/public-catalog-results";
import type { SearchHit } from "@/lib/search/types";

function hit(kind: SearchHit["kind"], url: string): SearchHit {
  return {
    id: `${kind}-${url}`,
    kind,
    kindLabel: kind,
    title: url,
    url,
    score: 1,
  };
}

describe("filterSearchHitsByPublicCatalog", () => {
  it("removes stale commercial links and keeps editorial results", () => {
    const results = filterSearchHitsByPublicCatalog(
      [
        hit("tour", "/tours/live-tour"),
        hit("tour", "/tours/removed-demo-tour"),
        hit("excursion", "/excursions/live-excursion?ref=search"),
        hit("excursion", "/excursions/removed-excursion"),
        hit("blog", "/blog/mendoza"),
      ],
      {
        tours: { status: "ok", paths: new Set(["/tours/live-tour"]) },
        excursions: { status: "ok", paths: new Set(["/excursions/live-excursion"]) },
      },
    );

    expect(results.map((result) => result.url)).toEqual([
      "/tours/live-tour",
      "/excursions/live-excursion?ref=search",
      "/blog/mendoza",
    ]);
  });

  it("keeps commercial hits when a catalogue slice is unavailable", () => {
    const results = filterSearchHitsByPublicCatalog(
      [
        hit("tour", "/tours/indexed-tour"),
        hit("excursion", "/excursions/indexed-excursion"),
        hit("blog", "/blog/mendoza"),
      ],
      {
        tours: { status: "unavailable" },
        excursions: { status: "unavailable" },
      },
    );

    expect(results.map((result) => result.url)).toEqual([
      "/tours/indexed-tour",
      "/excursions/indexed-excursion",
      "/blog/mendoza",
    ]);
  });

  it("hides commercial hits only after a confirmed-empty catalogue read", () => {
    const results = filterSearchHitsByPublicCatalog(
      [
        hit("tour", "/tours/stale-tour"),
        hit("excursion", "/excursions/stale-excursion"),
        hit("place", "/places/ushuaia"),
      ],
      {
        tours: { status: "ok", paths: new Set() },
        excursions: { status: "ok", paths: new Set() },
      },
    );

    expect(results.map((result) => result.url)).toEqual(["/places/ushuaia"]);
  });
});

