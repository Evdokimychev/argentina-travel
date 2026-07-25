import { describe, expect, it } from "vitest";
import {
  MEDIA_PICKER_BLOCK_TYPES,
  supportsMediaPicker,
} from "@/lib/cms/page-builder/media-picker-blocks";

describe("media picker block types", () => {
  it("covers photo and hero-banner so media library buttons work", () => {
    expect(MEDIA_PICKER_BLOCK_TYPES).toContain("photo");
    expect(MEDIA_PICKER_BLOCK_TYPES).toContain("hero-banner");
    expect(supportsMediaPicker("photo")).toBe(true);
    expect(supportsMediaPicker("hero-banner")).toBe(true);
    expect(supportsMediaPicker("paragraph")).toBe(false);
  });
});
