import { describe, expect, it } from "vitest";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import {
  expandI18nSitemapPaths,
  PUBLISHED_LOCALE_ROUTES,
} from "@/lib/i18n/sitemap-locales";

describe("publication-aware locale SEO", () => {
  it("does not add fallback locale URLs to sitemap", () => {
    expect(expandI18nSitemapPaths(["/", "/blog/article", "/es/blog/article"])).toEqual([
      "/",
      "/blog/article",
    ]);
    expect(PUBLISHED_LOCALE_ROUTES).toEqual([]);
  });

  it("adds hreflang only for explicitly published translations", () => {
    const fallback = buildHreflangAlternates("/blog/article");
    expect(fallback.languages).not.toHaveProperty("en");
    expect(fallback.languages).not.toHaveProperty("es");

    const published = buildHreflangAlternates("/blog/article", ["en"]);
    expect(published.languages).toHaveProperty("en");
    expect(published.languages).not.toHaveProperty("es");
  });
});
