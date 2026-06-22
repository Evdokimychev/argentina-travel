import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { tours } from "@/data/tours";

describe("Sprint 2 UI stabilization", () => {
  it("tours seed data has no Unsplash hotlinks (images from manifest resolver)", () => {
    const toursSource = readFileSync(resolve(process.cwd(), "src/data/tours.ts"), "utf8");
    expect(toursSource).not.toMatch(/unsplash\.com/);

    for (const tour of tours) {
      expect(tour.image).toMatch(/^\/media\//);
      expect(tour.gallery.every((url) => url.startsWith("/media/"))).toBe(true);
    }
  });

  it("tour cards use overlay link without duplicate CTA button", () => {
    const excursionCard = readFileSync(
      resolve(process.cwd(), "src/components/excursions/ExcursionCard.tsx"),
      "utf8"
    );
    const tourCard = readFileSync(
      resolve(process.cwd(), "src/components/marketplace/MarketplaceTourCard.tsx"),
      "utf8"
    );

    expect(excursionCard).toContain("ContentCardOverlayLink");
    expect(excursionCard).not.toMatch(/buttonVariants/);
    expect(tourCard).toContain("ContentCardOverlayLink");
    expect(tourCard).not.toMatch(/buttonVariants/);
  });

  it("BlogCtaBlock shows placeholder when misconfigured", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/page-builder/blocks/BlogCtaBlock.tsx"),
      "utf8"
    );
    expect(source).toMatch(/ближайшем обновлении/);
    expect(source).not.toMatch(/return null/);
  });

  it("GuideWidgetSlot shows coming-soon stub for unimplemented slots", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/guide/GuideWidgetSlot.tsx"),
      "utf8"
    );
    expect(source).toMatch(/GuideWidgetComingSoon/);
    expect(source).not.toMatch(/return null/);
  });
});
