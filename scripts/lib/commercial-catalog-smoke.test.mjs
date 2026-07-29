import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findCommercialDetailPath } from "./commercial-catalog-smoke.mjs";

describe("commercial catalog smoke", () => {
  it("finds a real tour detail and ignores region navigation", () => {
    const html = '<a href="/tours/region/patagonia">Регион</a><a href="/tours/real-trip-t42">Тур</a>';
    assert.equal(findCommercialDetailPath(html, "/tours"), "/tours/real-trip-t42");
  });

  it("finds an excursion detail and ignores city navigation", () => {
    const html =
      '<a href="/excursions/city/buenos-aires">Город</a><a href="/excursions/san-telmo-t50248">Экскурсия</a>';
    assert.equal(
      findCommercialDetailPath(html, "/excursions"),
      "/excursions/san-telmo-t50248",
    );
  });

  it("returns null for a genuinely empty catalog document", () => {
    assert.equal(findCommercialDetailPath("<main>Каталог временно недоступен</main>", "/tours"), null);
  });

  it("does not treat Next error and page chunk filenames as offer links", () => {
    const html = [
      '<script src="/_next/static/chunks/app/tours/error-3d3f202a6b80c451.js"></script>',
      '<script src="/_next/static/chunks/app/tours/page-f4362c953960a46f.js"></script>',
      'self.__next_f.push([1,"static/chunks/app/tours/error-3d3f202a6b80c451.js"])',
    ].join("");
    assert.equal(findCommercialDetailPath(html, "/tours"), null);
  });

  it("accepts serialized href fields but rejects reserved and error routes", () => {
    const html = [
      '\\"href\\":\\"/excursions/error-1f093ea7aa2b89fa\\"',
      '\\"href\\":\\"/excursions/guide/470707\\"',
      '\\"href\\":\\"/excursions/san-telmo-t50248?date=2026-08-01\\"',
    ].join(" ");
    assert.equal(
      findCommercialDetailPath(html, "/excursions"),
      "/excursions/san-telmo-t50248",
    );
  });

  it("ignores path-shaped text without an href boundary", () => {
    assert.equal(
      findCommercialDetailPath("asset=/tours/not-an-offer title=/tours/still-not-an-offer", "/tours"),
      null,
    );
  });
});
