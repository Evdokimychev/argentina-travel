import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  EXCURSIONS_CATALOG_SEO,
  EXPERTS_CATALOG_SEO,
  PATAGONIA_TOURS_SEO,
  TOURS_CATALOG_SEO,
  getExcursionCitySearchCopy,
  getExcursionCitySeoCopy,
  hasCommercialFilterParams,
} from "@/lib/commercial-catalog-seo";

const COPIES = [
  TOURS_CATALOG_SEO,
  PATAGONIA_TOURS_SEO,
  EXCURSIONS_CATALOG_SEO,
  EXPERTS_CATALOG_SEO,
];

describe("commercial catalog SEO copy", () => {
  it("covers the core commercial intents through useful, crawlable internal links", () => {
    expect(TOURS_CATALOG_SEO.links.some((link) => link.href === "/tours/region/patagonia")).toBe(
      true,
    );
    expect(
      EXCURSIONS_CATALOG_SEO.links.some(
        (link) => link.href === "/excursions/city/Buenos_Aires",
      ),
    ).toBe(true);
    expect(EXPERTS_CATALOG_SEO.title).toContain("русскоязычного гида");

    for (const copy of COPIES) {
      expect(copy.description.length).toBeGreaterThanOrEqual(100);
      expect(copy.links).toHaveLength(4);
      expect(new Set(copy.links.map((link) => link.href)).size).toBe(copy.links.length);
      for (const link of copy.links) {
        expect(link.href).toMatch(/^\//);
        expect(link.title.length).toBeGreaterThan(4);
        expect(link.description.length).toBeGreaterThan(20);
      }
    }
  });

  it("does not promise prices, seats or confirmation not present in inventory", () => {
    const text = JSON.stringify(COPIES);
    expect(text).not.toMatch(/лучшая цена|гарантированн|места есть|мгновенно подтвердим/i);
    expect(text).toMatch(/условия бронирования|условия.*карточк/i);
  });

  it("uses dedicated search copy for Buenos Aires and Iguazu", () => {
    const buenosAires = getExcursionCitySearchCopy("Buenos_Aires", "Буэнос-Айрес");
    const iguazu = getExcursionCitySearchCopy("Puerto_Iguazu", "Пуэрто-Игуасу");

    expect(buenosAires.heading).toBe("Экскурсии в Буэнос-Айресе");
    expect(buenosAires.metadataTitle.length).toBeLessThanOrEqual(70);
    expect(iguazu.heading).toContain("водопады Игуасу");
    expect(getExcursionCitySeoCopy("Puerto_Iguazu", "Пуэрто-Игуасу").description).toContain(
      "официальным источникам",
    );
  });

  it("keeps filtered catalog variants out of the index while allowing crawling", () => {
    expect(hasCommercialFilterParams({ query: "Патагония" })).toBe(true);
    expect(hasCommercialFilterParams({ language: "ru" })).toBe(true);
    expect(hasCommercialFilterParams({ utm_source: "newsletter" })).toBe(false);
  });
});

describe("commercial landing contracts", () => {
  it("keeps Patagonia as a dedicated landing with honest catalog schema and breadcrumbs", () => {
    const source = readFileSync(
      new URL("../app/tours/region/patagonia/page.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain('const PAGE_PATH = "/tours/region/patagonia"');
    expect(source).toContain("matchToursForDestination");
    expect(source).toContain("BreadcrumbListJsonLd");
    expect(source).toContain("CatalogItemListJsonLd");
    expect(source).toContain("hasCommercialFilterParams");
    expect(source).not.toMatch(/offers|availability|priceUsd/);
  });
});
