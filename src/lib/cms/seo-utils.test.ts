import { describe, expect, it } from "vitest";
import {
  buildDefaultSeoDescription,
  buildDefaultSeoTitle,
  seoDescriptionStatus,
  seoTitleStatus,
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
});
