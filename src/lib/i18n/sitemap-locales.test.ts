import { describe, expect, it } from "vitest";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { expandI18nSitemapPaths } from "@/lib/i18n/sitemap-locales";

describe("publication-aware locale SEO", () => {
  it("does not add fallback locale URLs to sitemap", () => {
    expect(expandI18nSitemapPaths(["/", "/blog/article"])).toEqual([
      "/",
      "/blog/article",
    ]);
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
