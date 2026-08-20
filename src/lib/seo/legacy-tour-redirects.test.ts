import { describe, expect, it } from "vitest";
import {
  LEGACY_WP_TOUR_REDIRECTS,
  matchLegacyTourPrefixRedirect,
} from "@/lib/seo/legacy-tour-redirects";

describe("legacy WordPress tour redirects", () => {
  it("maps known iguazu legacy URLs to the iguazu region landing", () => {
    const iguazuRedirects = LEGACY_WP_TOUR_REDIRECTS.filter((entry) =>
      entry.source.includes("iguazu"),
    );
    expect(iguazuRedirects.length).toBeGreaterThan(0);
    for (const entry of iguazuRedirects) {
      expect(entry.destination).toBe("/tours/region/iguazu");
      expect(entry.permanent).toBe(true);
    }
  });

  it("places semantic redirects before the catch-all by keeping unique sources", () => {
    const sources = LEGACY_WP_TOUR_REDIRECTS.map((entry) => entry.source);
    expect(new Set(sources).size).toBe(sources.length);
    expect(sources).toContain("/st_tour/iguazu-1-day");
    expect(sources).toContain("/st_tour/iguazu-argentina-2-days");
    expect(sources.every((source) => !/-:path\*/.test(source))).toBe(true);
  });

  it("matches hyphenated and nested prefix variants in middleware", () => {
    expect(matchLegacyTourPrefixRedirect("/st_tour/patagonia-10-days")).toBe(
      "/tours/region/patagonia",
    );
    expect(matchLegacyTourPrefixRedirect("/st_tour/buenos-aires-city-tour")).toBe("/tours");
    expect(matchLegacyTourPrefixRedirect("/st_tour/iguazu-1-day")).toBe("/tours/region/iguazu");
    expect(matchLegacyTourPrefixRedirect("/st_tour/unknown-tour")).toBeNull();
  });
});
