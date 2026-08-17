import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("home hero network contract", () => {
  it("renders the primary hero image exactly once", () => {
    const page = fs.readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8");
    const home = fs.readFileSync(
      path.join(process.cwd(), "src/components/marketplace/MarketplaceHome.tsx"),
      "utf8",
    );
    const collage = fs.readFileSync(
      path.join(process.cwd(), "src/components/marketplace/HomeHeroCollage.tsx"),
      "utf8",
    );

    expect(page).not.toContain("heroBackdropSrc=");
    expect(home).not.toContain("heroBackdropSrc");
    expect(collage.match(/src=\{heroSrc\}/g)).toHaveLength(1);
    expect(collage).toContain('const MOBILE_HERO_SRC = "/media/home/hero-mobile.webp"');
    expect(collage).toContain('srcSet={`${MOBILE_HERO_SRC} 640w`}');
    expect(collage).toContain('type="image/webp"');
    expect(collage).toContain("width={HERO_WIDTH}");
    expect(collage).toContain("height={HERO_HEIGHT}");
    expect(collage).toContain("sizes={HERO_SIZES}");
    expect(collage).toContain('decoding="sync"');
    expect(collage).toContain('fetchPriority="high"');
    expect(collage).toContain('loading="eager"');
    expect(collage).toContain('media="(max-width: 1023px)"');
    expect(collage).toContain('media="(min-width: 1024px)"');
    expect(collage).toContain('rel="preload"');
    expect(collage).toContain("as=\"image\"");
  });
});
