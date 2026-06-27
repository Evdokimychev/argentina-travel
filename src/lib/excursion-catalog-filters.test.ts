import { describe, expect, it } from "vitest";
import { filterExcursions } from "@/lib/excursion-catalog-filters";
import type { ExcursionListing } from "@/types/excursion";

const listings: ExcursionListing[] = [
  {
    partner: "tripster",
    id: 1,
    slug: "ind-t1",
    title: "Individual",
    cityId: 1,
    citySlug: "ba",
    cityName: "BA",
    reviewCount: 1,
    formatKind: "individual",
  },
  {
    partner: "tripster",
    id: 2,
    slug: "grp-t2",
    title: "Group",
    cityId: 1,
    citySlug: "ba",
    cityName: "BA",
    reviewCount: 2,
    formatKind: "group",
  },
];

describe("filterExcursions format filter", () => {
  it("filters individual excursions", () => {
    const result = filterExcursions(listings, {
      query: "",
      citySlug: "",
      sort: "popular",
      formats: ["individual"],
      durationBuckets: [],
      minRating: null,
      maxPrice: null,
      partners: [],
    });
    expect(result.map((item) => item.slug)).toEqual(["ind-t1"]);
  });

  it("filters group excursions", () => {
    const result = filterExcursions(listings, {
      query: "",
      citySlug: "",
      sort: "popular",
      formats: ["group"],
      durationBuckets: [],
      minRating: null,
      maxPrice: null,
      partners: [],
    });
    expect(result.map((item) => item.slug)).toEqual(["grp-t2"]);
  });

  it("treats missing formatKind as individual", () => {
    const result = filterExcursions(
      [{ ...listings[0], formatKind: undefined }],
      {
        query: "",
        citySlug: "",
        sort: "popular",
        formats: ["individual"],
        durationBuckets: [],
        minRating: null,
        maxPrice: null,
        partners: [],
      },
    );
    expect(result).toHaveLength(1);
  });
});
