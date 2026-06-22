import { describe, expect, it } from "vitest";
import {
  MOSAIC_LAYOUT_TEMPLATES,
  buildGalleryMosaicPlan,
} from "@/lib/media-detail-gallery-layout";

describe("media-detail-gallery-layout", () => {
  it("picks a stable layout for the same seed", () => {
    const first = buildGalleryMosaicPlan(16, "patagonia-glaciers");
    const second = buildGalleryMosaicPlan(16, "patagonia-glaciers");
    expect(first.layout.id).toBe(second.layout.id);
    expect(first.slots.map((slot) => slot.imageIndex)).toEqual(
      second.slots.map((slot) => slot.imageIndex),
    );
  });

  it("varies layout across different seeds", () => {
    const layouts = new Set(
      ["tour-a", "tour-b", "tour-c", "tour-d", "tour-e", "tour-f"].map(
        (seed) => buildGalleryMosaicPlan(12, seed).layout.id,
      ),
    );
    expect(layouts.size).toBeGreaterThan(1);
  });

  it("uses simplified templates for small galleries", () => {
    expect(buildGalleryMosaicPlan(1, "solo").layout.id).toBe("single");
    expect(buildGalleryMosaicPlan(2, "duo").layout.id).toBe("duo");
    expect(buildGalleryMosaicPlan(4, "quad").layout.id).toBe("quad");
  });

  it("shows at most five photos in mosaic slots", () => {
    const plan = buildGalleryMosaicPlan(20, "big-gallery");
    expect(plan.slots.length).toBeLessThanOrEqual(5);
    expect(plan.slots.some((slot) => slot.cell.showAllOverlay)).toBe(true);
  });

  it("defines multiple desktop templates", () => {
    expect(MOSAIC_LAYOUT_TEMPLATES.length).toBeGreaterThanOrEqual(4);
  });
});
