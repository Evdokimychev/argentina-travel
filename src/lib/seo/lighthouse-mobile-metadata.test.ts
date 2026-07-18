import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("mobile Lighthouse SEO boundary", () => {
  it("keeps metadata in head for headless mobile crawlers", () => {
    const config = readFileSync(join(root, "next.config.ts"), "utf8");

    expect(config).toContain("htmlLimitedBots");
    expect(config).toContain("const htmlLimitedBots = /.*/;");
    expect(config).toContain("instead of streaming it into <body>");
  });

  it("reserves the final fullscreen map height while server data streams", () => {
    const page = readFileSync(join(root, "src/app/mapa-argentina/page.tsx"), "utf8");

    expect(page).toContain(
      "h-[calc(100dvh-var(--site-header-full-height,72px)-var(--public-mobile-nav-height,0px))]",
    );
    expect(page).not.toContain('className="flex h-[60vh]');
  });
});
