import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Sprint 4 mobile bottom-layer collision contract", () => {
  it("keeps sticky booking bars above the public mobile nav", () => {
    const excursionBar = readFileSync(
      join(process.cwd(), "src/components/excursions/ExcursionMobileBookingBar.tsx"),
      "utf8",
    );
    const tourUi = readFileSync(join(process.cwd(), "src/lib/tour-detail-ui.ts"), "utf8");

    expect(excursionBar).toContain(
      "calc(var(--cookie-consent-offset,0px)+var(--public-mobile-nav-height,0px))",
    );
    expect(tourUi).toContain(
      "calc(var(--cookie-consent-offset,0px)+var(--public-mobile-nav-height,0px))",
    );
  });

  it("stops custom cursor permanent rAF when idle", () => {
    const cursor = readFileSync(join(process.cwd(), "src/components/CustomCursor.tsx"), "utf8");
    expect(cursor).toContain("IDLE_STOP_MS");
    expect(cursor).toContain("HIT_TEST_INTERVAL_MS");
    expect(cursor).toContain("prefers-reduced-motion");
    expect(cursor).toContain("pointer-events-none");
  });

  it("defers non-critical public chrome until idle", () => {
    const providers = readFileSync(join(process.cwd(), "src/components/Providers.tsx"), "utf8");
    expect(providers).toContain("IdleMount");
    expect(providers).toContain("GuideAssistantWidget");
    expect(providers).toContain("CustomCursor");
  });

  it("lazy-mounts mobile nav overlay from Header", () => {
    const header = readFileSync(join(process.cwd(), "src/components/Header.tsx"), "utf8");
    expect(header).toContain("SiteNavFullScreenOverlay");
    expect(header).toContain("mobileMenuMounted");
    expect(header).toMatch(/dynamic\(/);
  });

  it("hides disabled car-rental from mega-menu service footer", () => {
    const staticFooter = readFileSync(
      join(process.cwd(), "src/data/site-nav-client-static.ts"),
      "utf8",
    );
    expect(staticFooter).not.toContain('href: "/car-rental"');
  });

  it("keeps dark theme toggle off by default while DARK_THEME_ENABLED is false", () => {
    const normalize = readFileSync(
      join(process.cwd(), "src/lib/cms/site-globals/normalize.ts"),
      "utf8",
    );
    expect(normalize).toMatch(/showThemeToggle:\s*false/);
  });
});
