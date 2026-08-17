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
    const podbor = readFileSync(
      join(process.cwd(), "src/components/podbor/PodborQuestionScreen.tsx"),
      "utf8",
    );
    const toasts = readFileSync(
      join(process.cwd(), "src/components/feedback/SiteToastHost.tsx"),
      "utf8",
    );

    expect(excursionBar).toContain("tourDetailMobileBarClass");
    expect(tourUi).toContain(
      "calc(var(--cookie-consent-offset,0px)+var(--public-mobile-nav-height,0px))",
    );
    expect(podbor).toContain(
      "calc(var(--cookie-consent-offset,0px)+var(--public-mobile-nav-height,0px))",
    );
    expect(toasts).toContain("var(--public-mobile-nav-height,0px)");
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

  it("maps Tailwind sky utilities to accessible sky-ink by default", () => {
    const globals = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    const tokens = readFileSync(join(process.cwd(), "src/styles/tokens.css"), "utf8");
    expect(globals).toMatch(/--color-sky:\s*var\(--token-color-sky-ink\)/);
    expect(globals).toMatch(/--color-sky-flag:\s*var\(--token-color-sky\)/);
    expect(tokens).toContain("--token-color-sky: #74acdf");
    expect(tokens).toContain("--token-color-sky-ink: #35699f");
  });

  it("uses sky-ink for selected section-nav chips", () => {
    const sectionNav = readFileSync(join(process.cwd(), "src/lib/section-nav-ui.ts"), "utf8");
    expect(sectionNav).toContain("bg-sky-ink text-white");
    expect(sectionNav).not.toContain("bg-sky text-white");
  });

  it("keeps dark theme toggle off by default while DARK_THEME_ENABLED is false", () => {
    const normalize = readFileSync(
      join(process.cwd(), "src/lib/cms/site-globals/normalize.ts"),
      "utf8",
    );
    expect(normalize).toMatch(/showThemeToggle:\s*false/);
  });
});
