import { describe, expect, it } from "vitest";
import {
  normalizeCmsSectionBody,
  normalizeGuideSectionForCms,
  plainParagraphsToHtml,
  resolveSectionHtml,
  sectionHasBodyContent,
  enrichContentSectionsWithHtml,
} from "@/lib/content-section-body";

describe("plainParagraphsToHtml", () => {
  it("wraps non-empty paragraphs in p tags", () => {
    expect(plainParagraphsToHtml(["Первый", "Второй"])).toBe("<p>Первый</p><p>Второй</p>");
  });

  it("escapes HTML entities", () => {
    expect(plainParagraphsToHtml(["a < b"])).toBe("<p>a &lt; b</p>");
  });
});

describe("resolveSectionHtml", () => {
  it("prefers html over paragraphs", () => {
    expect(
      resolveSectionHtml({
        html: "<p><strong>Rich</strong></p>",
        paragraphs: ["Plain"],
      })
    ).toContain("<strong>Rich</strong>");
  });

  it("falls back to paragraphs", () => {
    expect(resolveSectionHtml({ paragraphs: ["Текст"] })).toBe("<p>Текст</p>");
  });
});

describe("sectionHasBodyContent", () => {
  it("detects html, paragraphs, list, and blocks", () => {
    expect(sectionHasBodyContent({ html: "<p>x</p>" })).toBe(true);
    expect(sectionHasBodyContent({ paragraphs: ["x"] })).toBe(true);
    expect(sectionHasBodyContent({ list: ["x"] })).toBe(true);
    expect(sectionHasBodyContent({ blocks: [{ type: "paragraph", text: "x" }] })).toBe(true);
    expect(sectionHasBodyContent({})).toBe(false);
  });
});

describe("normalizeCmsSectionBody", () => {
  it("stores sanitized html and syncs plain paragraphs", () => {
    const normalized = normalizeCmsSectionBody({
      heading: "H",
      html: "<p>Абзац <strong>жирный</strong></p>",
    });

    expect(normalized.html).toContain("<strong>жирный</strong>");
    expect(normalized.paragraphs?.[0]).toContain("жирный");
  });
});

describe("enrichContentSectionsWithHtml", () => {
  it("adds html from paragraphs when missing", () => {
    const sections = enrichContentSectionsWithHtml([
      { heading: "H", paragraphs: ["Текст раздела"], html: undefined },
    ]);
    expect(sections[0]?.html).toBe("<p>Текст раздела</p>");
  });

  it("keeps existing html", () => {
    const sections = enrichContentSectionsWithHtml([
      { html: "<p>Ready</p>", paragraphs: ["ignored"] },
    ]);
    expect(sections[0]?.html).toBe("<p>Ready</p>");
  });
});

describe("normalizeGuideSectionForCms", () => {
  it("derives plain paragraphs from blocks", () => {
    const normalized = normalizeGuideSectionForCms({
      heading: "FAQ",
      blocks: [{ type: "paragraph", text: "Ответ на вопрос." }],
    });
    expect(normalized.paragraphs).toEqual(["Ответ на вопрос."]);
    expect(normalized.blocks).toHaveLength(1);
  });
});
