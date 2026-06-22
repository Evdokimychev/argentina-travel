import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "src");

describe("Sprint 10 — Design System v2 & performance trim", () => {
  it("ContentCard primitive exposes shell, media, overlay link and hover class", () => {
    const source = readFileSync(join(root, "components/content/ContentCard.tsx"), "utf8");
    expect(source).toContain("contentCardShellClass");
    expect(source).toContain("ContentCardOverlayLink");
    expect(source).toContain("ContentCardMedia");
    expect(source).toContain("ContentCardBadges");
    expect(source).toContain("contentCardMediaHoverClass");
    expect(source).toContain("tokenCardSurfaceClass");
    expect(source).toContain("motion-reduce:transform-none");
  });

  it("blog, tour and excursion cards use ContentCard", () => {
    for (const file of [
      "components/blog/BlogCard.tsx",
      "components/marketplace/MarketplaceTourCard.tsx",
      "components/excursions/ExcursionCard.tsx",
    ]) {
      const source = readFileSync(join(root, file), "utf8");
      expect(source).toContain("ContentCard");
      expect(source).toContain("ContentCardOverlayLink");
    }
  });

  it("design tokens v2 document spacing, radius-card and shadow-elevated", () => {
    const tokensTs = readFileSync(join(root, "lib/design-tokens.ts"), "utf8");
    expect(tokensTs).toContain("Spacing scale");
    expect(tokensTs).toContain("--radius-card");
    expect(tokensTs).toContain("--shadow-elevated");
    expect(tokensTs).toContain("tokenHeaderShellScrolledClass");

    const tokensCss = readFileSync(join(process.cwd(), "src/styles/tokens.css"), "utf8");
    expect(tokensCss).toContain("--token-radius-card");
    expect(tokensCss).toContain("--token-shadow-elevated");

    const globals = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    expect(globals).toContain("--shadow-elevated");
    expect(globals).toContain("--radius-card");
  });

  it("header applies frosted backdrop on scroll", () => {
    const header = readFileSync(join(root, "components/Header.tsx"), "utf8");
    const tokens = readFileSync(join(root, "lib/design-tokens.ts"), "utf8");
    expect(header).toContain("headerScrolled");
    expect(header).toContain("tokenHeaderShellScrolledClass");
    expect(tokens).toContain("backdrop-blur-md");
  });

  it("footer newsletter uses upgraded token surface", () => {
    const newsletter = readFileSync(join(root, "components/FooterNewsletter.tsx"), "utf8");
    expect(newsletter).toContain("tokenCardSurfaceClass");
    expect(newsletter).toContain("bg-gradient-to-br");
    expect(newsletter).toContain("Подписка на новости");
  });

  it("prefers-reduced-motion disables card hover scale and gallery autoplay hook", () => {
    const globals = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    expect(globals).toContain(".content-card-media-hover:hover");
    expect(globals).toContain(".gallery-carousel-autoplay");
    expect(globals).toContain(".card-hover");
  });

  it("heavy chunks are code-split away from eager tour detail imports", () => {
    const itinerary = readFileSync(join(root, "components/tour-detail/ItinerarySection.tsx"), "utf8");
    expect(itinerary).toContain('dynamic(() => import("./ItineraryDayMiniMap")');
    expect(itinerary).toContain('dynamic(() => import("./TourItineraryPdfButton")');
    expect(itinerary).not.toMatch(/import TourItineraryPdfButton from/);

    const mapHub = readFileSync(join(root, "components/map/ArgentinaMapFullscreenHub.tsx"), "utf8");
    expect(mapHub).toContain("dynamic(");
    expect(mapHub).toContain("ArgentinaMapLibreCanvas");

    const pdfBtn = readFileSync(join(root, "components/tour-detail/TourItineraryPdfButton.tsx"), "utf8");
    expect(pdfBtn).toContain('await import(');
    expect(pdfBtn).toContain("download-tour-itinerary-pdf");
  });

  it("bundle report tracks Sprint 10 public trim baseline", () => {
    const script = readFileSync(join(process.cwd(), "scripts/bundle-report.mjs"), "utf8");
    expect(script).toContain("SPRINT10_BASELINE_TOTAL_KB");
    expect(script).toContain("PUBLIC_LAYOUT_BUDGET_KB");
    expect(script).toContain("organizer");
  });

  it("tour card shell delegates to ContentCard", () => {
    const shell = readFileSync(join(root, "lib/tour-card-shell.ts"), "utf8");
    expect(shell).toContain("contentCardShellClass");
  });
});
