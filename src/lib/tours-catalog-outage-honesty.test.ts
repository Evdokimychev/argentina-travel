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

    expect(page).toContain("catalogUnavailable: true");
    expect(page).toContain("catalogUnavailable={catalogUnavailable}");
    expect(catalog).toContain("Каталог туров временно недоступен");
    expect(catalog).toContain("Каталог временно недоступен");
    // Must not blame filters when the server failed closed.
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
  });
});
