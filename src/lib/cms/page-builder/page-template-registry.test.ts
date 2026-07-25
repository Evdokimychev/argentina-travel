import { describe, expect, it } from "vitest";
import { normalizeBlogBodyBlock } from "@/lib/cms/page-builder/block-normalize";
import {
  createPageBuilderPageTemplate,
  PAGE_BUILDER_PAGE_TEMPLATES,
  pageTemplatesForDocType,
} from "@/lib/cms/page-builder/page-template-registry";

describe("page builder page templates", () => {
  it("has unique multi-section packs made of supported blocks", () => {
    expect(new Set(PAGE_BUILDER_PAGE_TEMPLATES.map((item) => item.slug)).size).toBe(
      PAGE_BUILDER_PAGE_TEMPLATES.length,
    );
    for (const template of PAGE_BUILDER_PAGE_TEMPLATES) {
      const sections = template.create();
      expect(sections.length).toBeGreaterThan(1);
      for (const section of sections) {
        expect(section.title.trim().length).toBeGreaterThan(0);
        expect(section.blocks.length).toBeGreaterThan(0);
        for (const block of section.blocks) {
          expect(normalizeBlogBodyBlock(block)).not.toBeNull();
        }
      }
    }
  });

  it("returns detached copies per import", () => {
    for (const template of PAGE_BUILDER_PAGE_TEMPLATES) {
      const first = createPageBuilderPageTemplate(template.slug);
      const second = createPageBuilderPageTemplate(template.slug);
      expect(first).toEqual(second);
      expect(first[0]).not.toBe(second[0]);
      expect(first[0].blocks[0]).not.toBe(second[0].blocks[0]);
    }
  });

  it("filters packs by doc type", () => {
    const landing = pageTemplatesForDocType("landing").map((item) => item.slug);
    expect(landing).toContain("landing-hub-page");
    expect(landing).toContain("tour-story-page");
    expect(pageTemplatesForDocType("destination").map((item) => item.slug)).toContain(
      "destination-page",
    );
  });
});
