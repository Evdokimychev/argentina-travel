import { expect, test } from "@playwright/test";

/**
 * Sprint 11 — visual regression baseline for key public routes.
 * Update baselines: npm run test:e2e:visual -- --update-snapshots
 */
const VISUAL_SMOKE_PATHS = [
  "/",
  "/tours",
  "/excursions",
  "/tours/po-kontrastnoy-argentine-v-ritme-tango-buenos-ayres-patagoniya-vodopady-iguasu-i-t108535",
  "/blog",
  "/blog/argentinian-steak-guide",
  "/blog/best-time-to-visit-argentina",
  "/destinations/ba",
  "/destinations/patagonia",
  "/places",
  "/mapa-argentina",
  "/immigration",
  "/guide",
  "/baza-znaniy",
  "/baza-znaniy/kak-poluchit-prava-v-argentine",
  "/contacts",
  "/gallery",
];

test.describe("Sprint 4 visual smoke", () => {
  for (const pathname of VISUAL_SMOKE_PATHS) {
    test(`screenshot ${pathname}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(pathname, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).toBeVisible();
      await expect(page).toHaveScreenshot({
        fullPage: false,
        maxDiffPixelRatio: 0.03,
        animations: "disabled",
      });
    });
  }

  test("homepage below-fold destinations section", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const section = page.locator("main").first();
    await expect(section).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, Math.min(900, document.body.scrollHeight / 3)));
    await expect(page).toHaveScreenshot("home-below-fold.png", {
      fullPage: false,
      maxDiffPixelRatio: 0.04,
      animations: "disabled",
    });
  });
});