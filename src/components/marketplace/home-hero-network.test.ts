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
    expect(collage).toContain("priority");
    expect(collage).toContain('sizes="(max-width: 1023px) 100vw, 430px"');
  });
});
