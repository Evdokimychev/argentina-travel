import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findCommercialDetailPath } from "./commercial-catalog-smoke.mjs";

describe("commercial catalog smoke", () => {
  it("finds a real tour detail and ignores region navigation", () => {
    const html = '<a href="/tours/region/patagonia">Регион</a><a href="/tours/real-trip-t42">Тур</a>';
    assert.equal(findCommercialDetailPath(html, "/tours"), "/tours/real-trip-t42");
  });

  it("finds an excursion detail and ignores city navigation", () => {
    const html = '"/excursions/city/buenos-aires" "\/excursions\/san-telmo-t50248"';
    assert.equal(
      findCommercialDetailPath(html, "/excursions"),
      "/excursions/san-telmo-t50248",
    );
  });

  it("returns null for a genuinely empty catalog document", () => {
    assert.equal(findCommercialDetailPath("<main>Каталог временно недоступен</main>", "/tours"), null);
  });
});
