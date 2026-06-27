import { describe, expect, it } from "vitest";
import { buildExcursionSearchItems } from "@/lib/excursion-search-index";
import type { ExcursionListing } from "@/types/excursion";

describe("buildExcursionSearchItems", () => {
  it("includes formatKind in keywords", () => {
    const items = buildExcursionSearchItems([
      {
        partner: "tripster",
        id: 1,
        slug: "ind-t1",
        title: "Walk",
        cityId: 1,
        citySlug: "ba",
        cityName: "BA",
        reviewCount: 0,
        formatKind: "individual",
        format: "walk",
      } satisfies ExcursionListing,
    ]);

    expect(items[0]?.keywords).toContain("individual");
    expect(items[0]?.keywords).toContain("индивидуальная");
  });
});
