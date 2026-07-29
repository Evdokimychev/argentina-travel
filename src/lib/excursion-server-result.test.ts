import { describe, expect, it } from "vitest";
import {
  resolveExcursionCatalogSources,
  resolveExcursionDetailSources,
} from "@/lib/excursion-server";
import type { ExcursionListResult, ExcursionListing } from "@/types/excursion";

const emptyCatalog: ExcursionListResult = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 500,
  cities: [],
};

const listing: ExcursionListing = {
  partner: "tripster",
  id: 42,
  slug: "tripster-demo-42",
  title: "Буэнос-Айрес без спешки",
  cityId: 1,
  citySlug: "buenos-aires",
  cityName: "Буэнос-Айрес",
  reviewCount: 10,
};

const unavailable = {
  status: "unavailable" as const,
  retryable: true as const,
  errorClass: "db_unavailable" as const,
  message: "database down",
};

describe("resolveExcursionCatalogSources", () => {
  it("confirms an empty catalog only when every source answered", () => {
    const result = resolveExcursionCatalogSources({}, {
      platform: { status: "ok", data: [] },
      tripster: { status: "ok", data: emptyCatalog },
      sputnik8: { status: "ok", data: emptyCatalog },
    });

    expect(result).toMatchObject({ status: "ok", data: { total: 0, catalogState: "empty" } });
  });

  it("returns unavailable when zero data cannot be confirmed across sources", () => {
    const result = resolveExcursionCatalogSources({}, {
      platform: { status: "ok", data: [] },
      tripster: unavailable,
      sputnik8: unavailable,
    });

    expect(result.status).toBe("unavailable");
  });

  it("serves partial data without hiding unavailable sources", () => {
    const result = resolveExcursionCatalogSources({ page: 2, pageSize: 1 }, {
      platform: unavailable,
      tripster: {
        status: "ok",
        data: { ...emptyCatalog, items: [listing], total: 1 },
      },
      sputnik8: unavailable,
    });

    expect(result).toMatchObject({
      status: "ok",
      data: {
        items: [],
        total: 1,
        catalogState: "partial",
        unavailableSources: ["platform", "sputnik8"],
      },
    });
  });
});

describe("resolveExcursionDetailSources", () => {
  it("does not turn a dependency failure into confirmed absence", () => {
    const result = resolveExcursionDetailSources([
      ["platform", { status: "ok", data: null }],
      ["tripster", unavailable],
    ]);
    expect(result.status).toBe("unavailable");
  });

  it("lets a resolved source override an earlier unavailable source", () => {
    const result = resolveExcursionDetailSources([
      ["platform", unavailable],
      ["tripster", { status: "ok", data: listing as never }],
    ]);
    expect(result).toMatchObject({ status: "ok", data: { slug: listing.slug } });
  });
});
