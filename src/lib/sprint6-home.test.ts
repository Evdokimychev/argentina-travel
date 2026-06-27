import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { POPULAR_DESTINATIONS } from "@/data/filters";

const root = join(process.cwd(), "src");

describe("Sprint 6 — premium homepage", () => {
  it("MarketplaceHome wires hero collage, SectionShell and testimonials", () => {
    const source = readFileSync(join(root, "components/marketplace/MarketplaceHome.tsx"), "utf8");
    expect(source).toContain("heroCollage");
    expect(source).toContain("HomeTestimonialsSection");
    expect(source).toContain("SectionShell");
    expect(source).toContain("HOME_FEATURED_REGIONS");
    expect(source).toContain("POPULAR_DESTINATIONS.slice(0, 6)");
    expect(source).not.toContain("SectionHeader");
    expect(source).not.toContain("TestimonialCard");
  });

  it("home hero collage uses mobile-safe object position", () => {
    const source = readFileSync(join(root, "components/marketplace/HomeHeroCollage.tsx"), "utf8");
    expect(source).toContain("object-[center_35%]");
    expect(source).toContain("motion-reduce:transform-none");
  });

  it("SectionShell supports eyebrow, reveal and scroll rail tone", () => {
    const source = readFileSync(join(root, "components/layout/SectionShell.tsx"), "utf8");
    expect(source).toContain("useRevealAnimation");
    expect(source).toContain("eyebrow?:");
    expect(source).toContain("scrollRailTone");
    expect(source).toContain("data-scroll-rail-tone");
  });

  it("PlatformStatsBlock has icon tiles and reveal animation", () => {
    const source = readFileSync(join(root, "components/marketplace/PlatformStatsBlock.tsx"), "utf8");
    expect(source).toContain("useRevealAnimation");
    expect(source).toMatch(/Map|Users|CheckCircle2|Sparkles/);
  });

  it("HomeTestimonialsSection hides when no verified reviews", () => {
    const source = readFileSync(join(root, "components/marketplace/HomeTestimonialsSection.tsx"), "utf8");
    expect(source).toContain("return null");
    expect(source).not.toContain("Первые отзывы скоро");
    expect(source).toContain('reveal');
  });

  it("featured regions slice is within POPULAR_DESTINATIONS manifest covers", () => {
    expect(POPULAR_DESTINATIONS.length).toBeGreaterThanOrEqual(6);
    for (const dest of POPULAR_DESTINATIONS.slice(0, 6)) {
      expect(dest.image).toBeTruthy();
      expect(dest.image.startsWith("/media/") || dest.image.startsWith("http")).toBe(true);
    }
  });

  it("sticky search block on desktop homepage", () => {
    const source = readFileSync(join(root, "components/marketplace/MarketplaceHome.tsx"), "utf8");
    expect(source).toContain("lg:sticky");
    expect(source).toContain("--site-header-height");
  });
});
