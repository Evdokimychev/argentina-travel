import { expect, test } from "@playwright/test";

/**
 * Sprint 11 — visual regression baseline for key public routes.
 * Update baselines: npm run test:e2e:visual -- --update-snapshots
 */
const VISUAL_SMOKE_PATHS = [
  "/",
  "/tours",
  "/tours/patagonia-glaciers",
  "/blog",
  "/blog/buenos-aires-rajony",
  "/blog/natsionalnyy-park-iguasu",
  "/destinations/patagonia",
  "/mapa-argentina",
  "/immigration",
  "/gallery",
];

test.describe("Sprint 11 visual smoke", () => {
  for (const pathname of VISUAL_SMOKE_PATHS) {
    test(`screenshot ${pathname}`, async ({ page }) => {
      await page.goto(pathname, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).toBeVisible();
      await expect(page).toHaveScreenshot({
        fullPage: false,
        maxDiffPixelRatio: 0.03,
        animations: "disabled",
      });
    });
  }
});
