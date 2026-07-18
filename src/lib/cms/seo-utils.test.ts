import { describe, expect, it } from "vitest";
import {
  buildDefaultSeoDescription,
  buildDefaultSeoTitle,
  isCmsDocumentNoIndex,
  seoCanonicalError,
  seoDescriptionStatus,
  seoImageError,
  seoTitleStatus,
  validateAndNormalizeCmsSeo,
} from "@/lib/cms/seo-utils";

describe("seo-utils", () => {
  it("evaluates title length status", () => {
    expect(seoTitleStatus("")).toBe("empty");
    expect(seoTitleStatus("Короткий")).toBe("short");
    expect(seoTitleStatus("Национальный парк Игуасу — полный путеводитель 2026")).toBe("good");
  });

  it("builds default seo title with custom site name", () => {
    expect(buildDefaultSeoTitle("Игуасу", "Go Argentina")).toBe("Игуасу | Go Argentina");
    expect(buildDefaultSeoTitle("Игуасу | Go Argentina", "Go Argentina")).toBe(
      "Игуасу | Go Argentina"
    );
  });

  it("builds default seo title with default site name", () => {
    expect(buildDefaultSeoTitle("Игуасу")).toContain("Игуасу");
    expect(buildDefaultSeoTitle("Игуасу")).toContain("Пора в Аргентину");
  });

  it("builds description from excerpt", () => {
    const excerpt = "A".repeat(90);
    expect(buildDefaultSeoDescription(excerpt, "Title").length).toBeLessThanOrEqual(160);
    expect(seoDescriptionStatus(buildDefaultSeoDescription(excerpt, "Title"))).toBe("good");
  });

  it("keeps generated titles within the recommended length", () => {
    const title = "Очень длинный заголовок страницы о путешествии по Аргентине и Патагонии";
    expect(buildDefaultSeoTitle(title).length).toBeLessThanOrEqual(60);
  });

  it("validates canonical URLs against the production host", () => {
    expect(seoCanonicalError("/blog/iguazu")).toBeNull();
    expect(seoCanonicalError("https://www.goargentina.ru/blog/iguazu")).toBeNull();
    expect(seoCanonicalError("https://example.com/blog/iguazu")).not.toBeNull();
    expect(seoCanonicalError("//example.com/blog/iguazu")).not.toBeNull();
    expect(seoCanonicalError("/blog/iguazu#map")).not.toBeNull();
  });

  it("rejects unsafe social image schemes", () => {
    expect(seoImageError("/media/blog/iguazu/hero.jpg")).toBeNull();
    expect(seoImageError("media/blog/iguazu/hero.jpg")).toBeNull();
    expect(seoImageError("https://media.goargentina.ru/media/blog/hero.jpg")).toBeNull();
    expect(seoImageError("javascript:alert(1)")).not.toBeNull();
  });

  it("normalizes supported SEO fields and drops false noindex", () => {
    expect(
      validateAndNormalizeCmsSeo({
        title: "  Игуасу  ",
        description: " ",
        canonical: " /places/iguazu ",
        image: " media/places/iguazu/hero.jpg ",
        noIndex: false,
      })
    ).toEqual({
      ok: true,
      seo: {
        title: "Игуасу",
        description: undefined,
        canonical: "/places/iguazu",
        image: "media/places/iguazu/hero.jpg",
        noIndex: undefined,
      },
    });
  });

  it("defaults unpublished documents to noindex", () => {
    expect(isCmsDocumentNoIndex("draft")).toBe(true);
    expect(isCmsDocumentNoIndex("scheduled")).toBe(true);
    expect(isCmsDocumentNoIndex("published")).toBe(false);
    expect(isCmsDocumentNoIndex("published", true)).toBe(true);
  });
});
