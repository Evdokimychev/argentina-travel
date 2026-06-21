import { describe, expect, it } from "vitest";
import { resolveBlogSectionBlocks } from "@/lib/blog-section-blocks";

describe("resolveBlogSectionBlocks", () => {
  it("merges parsed body with slug-level typed blocks", () => {
    const blocks = resolveBlogSectionBlocks(
      {
        title: "Когда дешевле всего путешествовать",
        body: "Наиболее бюджетными считаются май и сентябрь.",
      },
      "best-time-to-visit-argentina",
    );
    expect(blocks.some((b) => b.type === "budget")).toBe(true);
    expect(blocks.some((b) => b.type === "paragraph")).toBe(true);
  });

  it("uses section.blocks when provided", () => {
    const blocks = resolveBlogSectionBlocks({
      title: "Логистика",
      body: "",
      blocks: [{ type: "map", lat: -34.6, lng: -58.38, label: "Буэнос-Айрес" }],
    });
    expect(blocks).toEqual([
      { type: "map", lat: -34.6, lng: -58.38, label: "Буэнос-Айрес" },
    ]);
  });
});
