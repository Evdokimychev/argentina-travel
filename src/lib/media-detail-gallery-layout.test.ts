import { describe, expect, it } from "vitest";
import {
  MOSAIC_LAYOUT_TEMPLATES,
  buildGalleryMosaicPlan,
} from "@/lib/media-detail-gallery-layout";
import { galleryImageIdentityKey } from "@/lib/gallery-images";

function sampleImages(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `https://example.com/tour-photo-${index + 1}.jpg`);
}

describe("media-detail-gallery-layout", () => {
  it("picks a stable layout for the same seed", () => {
    const images = sampleImages(16);
    const first = buildGalleryMosaicPlan(images, "patagonia-glaciers");
    const second = buildGalleryMosaicPlan(images, "patagonia-glaciers");
    expect(first.layout.id).toBe(second.layout.id);
    expect(first.slots.map((slot) => slot.imageIndex)).toEqual(
      second.slots.map((slot) => slot.imageIndex),
    );
  });

  it("varies layout across different seeds", () => {
    const layouts = new Set(
      ["tour-a", "tour-b", "tour-c", "tour-d", "tour-e", "tour-f"].map(
        (seed) => buildGalleryMosaicPlan(sampleImages(12), seed).layout.id,
      ),
    );
    expect(layouts.size).toBeGreaterThan(1);
  });

  it("uses simplified templates for small galleries", () => {
    expect(buildGalleryMosaicPlan(sampleImages(1), "solo").layout.id).toBe("single");
    expect(buildGalleryMosaicPlan(sampleImages(2), "duo").layout.id).toBe("duo");
    expect(buildGalleryMosaicPlan(sampleImages(4), "quad").layout.id).toBe("quad");
  });

  it("shows at most five photos in mosaic slots", () => {
    const plan = buildGalleryMosaicPlan(sampleImages(20), "big-gallery");
    expect(plan.slots.length).toBeLessThanOrEqual(5);
    expect(plan.slots.some((slot) => slot.cell.showAllOverlay)).toBe(true);
  });

  it("does not repeat the same image in mosaic slots", () => {
    const duplicate = "https://cf.youtravel.me/upload/main/9f1/abc123def456ghi789.JPG";
    const images = [
      duplicate,
      "https://cf.youtravel.me/upload/main/9f1/photo-two.JPG",
      "https://cf.youtravel.me/upload/main/9f1/photo-three.JPG",
      "https://cf.youtravel.me/upload/main/9f1/photo-four.JPG",
      "https://cf.youtravel.me/upload/main/9f1/abc123def456ghi789.jpg",
      ...sampleImages(10),
    ];

    const plan = buildGalleryMosaicPlan(images, "youtravel-tour");
    const keys = plan.slots.map((slot) => galleryImageIdentityKey(plan.images[slot.imageIndex]!));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("defines multiple desktop templates", () => {
    expect(MOSAIC_LAYOUT_TEMPLATES.length).toBeGreaterThanOrEqual(4);
  });
});
