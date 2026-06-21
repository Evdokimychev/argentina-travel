import { describe, expect, it } from "vitest";
import { resolveGuideSectionBlocks } from "@/lib/guide-section-blocks";

describe("resolveGuideSectionBlocks", () => {
  it("returns typed blocks when present", () => {
    const blocks = [{ type: "paragraph" as const, text: "Текст" }];
    expect(resolveGuideSectionBlocks({ blocks })).toEqual(blocks);
  });

  it("returns empty array when no blocks", () => {
    expect(resolveGuideSectionBlocks({ html: "<p>x</p>" })).toEqual([]);
  });
});
