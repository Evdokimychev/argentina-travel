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
        tours: new Set(["/tours/live-tour"]),
        excursions: new Set(["/excursions/live-excursion"]),
      },
    );

    expect(results.map((result) => result.url)).toEqual([
      "/tours/live-tour",
      "/excursions/live-excursion?ref=search",
      "/blog/mendoza",
    ]);
  });
});

