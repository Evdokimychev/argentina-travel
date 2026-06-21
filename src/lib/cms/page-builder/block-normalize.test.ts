import { describe, expect, it } from "vitest";
import {
  createPageBuilderBlock,
  PAGE_BUILDER_BLOCKS,
} from "@/lib/cms/page-builder/block-registry";
import {
  normalizeBlogBodyBlock,
  normalizeBlogBodyBlocks,
  parseCmsBlogSection,
} from "@/lib/cms/page-builder/block-normalize";

describe("page-builder block registry", () => {
  it("creates default blocks for every slug", () => {
    for (const def of PAGE_BUILDER_BLOCKS) {
      const block = createPageBuilderBlock(def.slug);
      expect(block.type).toBe(def.slug);
    }
  });
});

describe("block normalize", () => {
  it("round-trips callout block", () => {
    const raw = { type: "callout", variant: "tip", title: "Совет", body: "Текст" };
    expect(normalizeBlogBodyBlock(raw)).toEqual(raw);
  });

  it("parses cms blog section with blocks", () => {
    const section = parseCmsBlogSection({
      title: "FAQ",
      body: "",
      blockType: "faq",
      blocks: [{ type: "faq", items: [{ question: "Q?", answer: "A." }] }],
    });
    expect(section.blockType).toBe("faq");
    expect(section.blocks).toHaveLength(1);
  });

  it("filters invalid blocks", () => {
    const blocks = normalizeBlogBodyBlocks([
      { type: "paragraph", text: "ok" },
      { type: "unknown" },
      null,
    ]);
    expect(blocks).toHaveLength(1);
  });
});
