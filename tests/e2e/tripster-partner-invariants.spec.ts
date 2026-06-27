import { expect, test } from "@playwright/test";

const tourSlug = process.env.TRIPSTER_E2E_TOUR_SLUG?.trim();

const mockScheduleDates = [
  {
    id: "tripster-2026-09-10-08:00",
    startDate: "2026-09-10",
    endDate: "2026-09-16",
    spotsLeft: 6,
    seatsTotal: 12,
    priceUsd: 0,
    partnerPriceValue: 3490,
    partnerPriceCurrency: "USD",
  },
];

test.describe("Tripster partner invariants smoke", () => {
  test.beforeEach(({ page }, testInfo) => {
    if (!tourSlug) {
      testInfo.skip(
        true,
        "Set TRIPSTER_E2E_TOUR_SLUG to a Tripster partner tour slug (…-t{id})."
      );
    }

    void page.route(`**/api/partner-tours/${tourSlug}/schedule`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          dates: mockScheduleDates,
          configured: true,
          affiliateFallback: `/api/affiliate/go/${tourSlug}`,
        }),
      });
    });
  });

  test("capacity panel and affiliate fallback link are visible", async ({ page }, testInfo) => {
    const response = await page.goto(`/tours/${tourSlug}`, {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });

    if (!response || response.status() === 404) {
      testInfo.skip(true, `Tour page /tours/${tourSlug} is not available in this environment.`);
    }

    const capacityPanel = page.locator("text=Уже едут").first();
    await expect(capacityPanel).toBeVisible({ timeout: 20_000 });

    const affiliateLink = page.locator(`a[href*="/api/affiliate/go/${tourSlug}"]`).first();
    await expect(affiliateLink).toBeVisible({ timeout: 20_000 });
  });
});
