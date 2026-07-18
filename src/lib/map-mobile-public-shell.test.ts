import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("mobile public map shell", () => {
  it("preserves useful map height on a 320×568 viewport", () => {
    const hub = source("src/components/map/ArgentinaMapFullscreenHub.tsx");
    expect(hub).toContain("var(--public-mobile-nav-height,0px)");
    expect(hub).toContain("min-h-[320px]");
    expect(hub).toContain("top-[72px]");
    expect(hub).not.toContain("min-h-[520px] w-full");
  });

  it("moves mobile search and filters into a bounded bottom sheet", () => {
    const controls = source("src/components/map/MapControlsPanel.tsx");
    expect(controls).toContain('aria-label="Поиск и фильтры карты"');
    expect(controls).toContain("max-sm:!max-h-[min(78dvh,40rem)]");
    expect(controls).toContain("overscroll-contain");
    expect(controls).toContain("Показать на карте");
  });

  it("uses 44px minimum targets for mobile map filters and controls", () => {
    const controls = source("src/components/map/MapControlsPanel.tsx");
    const categories = source("src/components/map/MapCategoryFilters.tsx");
    const hub = source("src/components/map/ArgentinaMapFullscreenHub.tsx");
    expect(controls).toContain("h-11 w-11");
    expect(categories).toContain("min-h-11");
    expect(hub).toContain("[&>button]:!h-11");
  });

  it("reserves a safe-area inset and yields on booking detail pages", () => {
    const chrome = source("src/components/SiteChrome.tsx");
    const responsive = source("src/lib/responsive-ui.ts");
    const navigation = source("src/lib/public-mobile-nav.ts");
    expect(chrome).toContain("PublicMobileBottomNav");
    expect(chrome).toContain("publicMobileNavInsetClass");
    expect(responsive).toContain("env(safe-area-inset-bottom,0px)");
    expect(navigation).toContain("(?:tours|excursions)");
  });
});
