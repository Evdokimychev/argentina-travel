import { describe, expect, it } from "vitest";
import { dedupeSearchHits } from "@/lib/search/search-client";
import type { SearchHit } from "@/lib/search/types";

function hit(overrides: Partial<SearchHit>): SearchHit {
  return {
    id: "result",
    kind: "blog",
    kindLabel: "Блог",
    title: "Malbec в Мендосе",
    url: "/blog/malbec",
    score: 10,
    ...overrides,
  };
}

describe("dedupeSearchHits", () => {
  it("keeps the first ranked result for duplicate titles and URLs", () => {
    const results = dedupeSearchHits([
      hit({ id: "best", url: "/blog/food-malbec" }),
      hit({ id: "same-title", url: "/blog/wine-malbec", score: 9 }),
      hit({ id: "same-url", title: "Другое название", url: "/blog/food-malbec", score: 8 }),
      hit({ id: "unique", title: "Винодельни Мендосы", url: "/blog/wineries", score: 7 }),
    ]);

    expect(results.map((result) => result.id)).toEqual(["best", "unique"]);
  });
});
