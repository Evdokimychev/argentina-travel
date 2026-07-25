import { describe, expect, it } from "vitest";
import { resolveBlogSectionBlocks } from "@/lib/blog-section-blocks";
import { BEST_TIME_TO_VISIT_ARGENTINA_SECTIONS } from "@/data/blog-best-time-to-visit-argentina";

describe("resolveBlogSectionBlocks", () => {
  it("uses section.blocks for season-matrix on best-time article", () => {
    const matrixSection = BEST_TIME_TO_VISIT_ARGENTINA_SECTIONS.find((section) =>
      section.blocks?.some((block) => block.type === "season-matrix"),
    );
    expect(matrixSection).toBeTruthy();
    const blocks = resolveBlogSectionBlocks(
      matrixSection!,
      "best-time-to-visit-argentina",
    );
    expect(blocks.some((b) => b.type === "season-matrix")).toBe(true);
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
