import { describe, expect, it } from "vitest";
import { normalizeBlogBodyBlock } from "@/lib/cms/page-builder/block-normalize";
import {
  createPageBuilderPattern,
  getPageBuilderPatternPreviewChips,
  matchesPageBuilderPattern,
  PAGE_BUILDER_PATTERN_CATEGORIES,
  PAGE_BUILDER_PATTERNS,
} from "@/lib/cms/page-builder/pattern-registry";

function expectDetachedCopy(first: unknown, second: unknown): void {
  if (typeof first !== "object" || first === null) return;

  expect(first).not.toBe(second);
  if (Array.isArray(first)) {
    expect(Array.isArray(second)).toBe(true);
    first.forEach((value, index) => expectDetachedCopy(value, (second as unknown[])[index]));
    return;
  }

  expect(typeof second).toBe("object");
  expect(second).not.toBeNull();
  Object.entries(first).forEach(([key, value]) => {
    expectDetachedCopy(value, (second as Record<string, unknown>)[key]);
  });
}

describe("page builder pattern registry", () => {
  it("has unique patterns made only of supported blocks", () => {
    expect(new Set(PAGE_BUILDER_PATTERNS.map((pattern) => pattern.slug)).size).toBe(PAGE_BUILDER_PATTERNS.length);
    for (const pattern of PAGE_BUILDER_PATTERNS) {
      expect(pattern.create().length).toBeGreaterThan(1);
      for (const block of pattern.create()) expect(normalizeBlogBodyBlock(block)).not.toBeNull();
    }
  });

  it("returns fully detached block collections for every insertion", () => {
    for (const pattern of PAGE_BUILDER_PATTERNS) {
      const first = createPageBuilderPattern(pattern.slug);
      const second = createPageBuilderPattern(pattern.slug);
      expect(first).toEqual(second);
      expectDetachedCopy(first, second);
    }
  });

  it("finds thematic patterns by labels and hidden tags", () => {
    const byQuery = (query: string) => PAGE_BUILDER_PATTERNS
      .filter((pattern) => matchesPageBuilderPattern(pattern, query))
      .map((pattern) => pattern.slug);

    expect(byQuery("ИГУАСУ")).toContain("iguazu-waterfalls");
    expect(byQuery("Перито-Морено")).toContain("patagonia-glaciers");
    expect(byQuery("лёд")).toContain("patagonia-glaciers");
    expect(byQuery("достопримечательности")).toContain("buenos-aires-city-guide");
    expect(byQuery("рестораны")).toContain("wine-and-food");
    expect(byQuery("итинерарий")).toContain("day-by-day-route");
    expect(byQuery("путеводитель")).toContain("practical-guide");
    expect(byQuery("отзывы")).toContain("reviews-social-proof");
    expect(byQuery("Доверие")).toContain("reviews-social-proof");
  });

  it("assigns every pattern a known category and preview chips", () => {
    for (const pattern of PAGE_BUILDER_PATTERNS) {
      expect(PAGE_BUILDER_PATTERN_CATEGORIES[pattern.category]).toBeDefined();
      expect(getPageBuilderPatternPreviewChips(pattern).length).toBeGreaterThan(0);
    }
  });
});
