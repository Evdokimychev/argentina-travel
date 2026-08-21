import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("tours catalog outage honesty", () => {
  it("propagates catalogUnavailable into ToursCatalog empty copy", () => {
    const page = fs.readFileSync(
      path.join(process.cwd(), "src/app/tours/page.tsx"),
      "utf8",
    );
    const catalog = fs.readFileSync(
      path.join(process.cwd(), "src/components/marketplace/ToursCatalog.tsx"),
      "utf8",
    );

    expect(page).toContain("fetchMarketplaceToursSafely");
    expect(page).toContain("catalogUnavailable={catalogUnavailable}");
    expect(catalog).toContain("Каталог туров временно недоступен");
    expect(catalog).toContain("Каталог временно недоступен");
    expect(catalog).toMatch(
      /catalogUnavailable && activeFilterCount === 0[\s\S]*Каталог туров временно недоступен/,
    );
  });

  it("clears previous SiteSearch hits before fetching a new query", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/components/SiteSearch.tsx"),
      "utf8",
    );
    expect(source).toMatch(/setApiHits\(null\);\s*setSearchNotice\(null\);\s*setLoading\(true\);/);
    expect(source).toContain(
      "if (live.length === 0 && fallbackResults.length > 0) return fallbackResults;",
    );
  });

  it("keeps /podbor and sibling catalog pages usable when marketplace fetch fails", () => {
    const server = fs.readFileSync(
      path.join(process.cwd(), "src/data/marketplace-tours-server.ts"),
      "utf8",
    );
    expect(server).toContain("export async function fetchMarketplaceToursSafely");

    for (const relative of [
      "src/app/podbor/page.tsx",
      "src/app/about/page.tsx",
      "src/app/places/[slug]/page.tsx",
      "src/app/destinations/[slug]/page.tsx",
      "src/app/tours/region/patagonia/page.tsx",
      "src/app/tours/region/iguazu/page.tsx",
      "src/app/organizers/[slug]/page.tsx",
      "src/app/embed/tours/page.tsx",
    ]) {
      const source = fs.readFileSync(path.join(process.cwd(), relative), "utf8");
      expect(source, relative).toContain("fetchMarketplaceToursSafely");
      expect(source, relative).not.toMatch(/await fetchMarketplaceTours\(\)/);
    }

    const view = fs.readFileSync(
      path.join(process.cwd(), "src/components/podbor/PodborView.tsx"),
      "utf8",
    );
    expect(view).toContain("Каталог туров временно недоступен");

    const destinationView = fs.readFileSync(
      path.join(process.cwd(), "src/components/destinations/DestinationDetailView.tsx"),
      "utf8",
    );
    expect(destinationView).toContain("catalogUnavailable");
    expect(destinationView).toContain("Каталог туров временно недоступен");

    const excursionsPage = fs.readFileSync(
      path.join(process.cwd(), "src/app/excursions/page.tsx"),
      "utf8",
    );
    expect(excursionsPage).toContain("fetchExcursionsResultSafely");
    expect(excursionsPage).toContain("catalogUnavailable={catalogUnavailable}");
    expect(excursionsPage).not.toMatch(/await fetchExcursionsServer\(/);
    expect(excursionsPage).not.toMatch(/await fetchExcursionsResultServer\(/);

    const excursionServer = fs.readFileSync(
      path.join(process.cwd(), "src/lib/excursion-server.ts"),
      "utf8",
    );
    expect(excursionServer).toContain("export async function fetchExcursionsResultSafely");
    expect(excursionServer).toContain("EXCURSION_CATALOG_DEADLINE_MS");

    const excursionsCatalog = fs.readFileSync(
      path.join(process.cwd(), "src/components/excursions/ExcursionsCatalog.tsx"),
      "utf8",
    );
    expect(excursionsCatalog).toContain("Каталог экскурсий временно недоступен");

    const excursionsSearchIndex = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/excursions/search-index/route.ts"),
      "utf8",
    );
    expect(excursionsSearchIndex).toContain("fetchExcursionsResultSafely");
    expect(excursionsSearchIndex).not.toMatch(/fetchExcursionsServer\(/);

    const searchRoute = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/search/route.ts"),
      "utf8",
    );
    expect(searchRoute).toContain("fetchExcursionsResultSafely");
    expect(searchRoute).not.toMatch(/fetchExcursionsServer\(/);
  });
});
