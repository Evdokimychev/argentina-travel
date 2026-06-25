import { expect, test } from "@playwright/test";

const tourSlug = process.env.YOUTRAVEL_E2E_TOUR_SLUG?.trim();

/** Mock schedule with capacity regression payload (all seats free, misleading counters). */
const mockCapacityRegressionDates = [
  {
    id: "yt-offer-cap-regression",
    startDate: "2026-09-10",
    endDate: "2026-09-15",
    spotsLeft: 8,
    seatsTotal: 8,
    priceUsd: 5628,
    partnerPriceValue: 5628,
    partnerPriceCurrency: "USD",
    travelersGoingCount: 0,
  },
];

test.describe("YouTravel partner invariants smoke", () => {
  test.beforeEach(({ page }, testInfo) => {
    if (!tourSlug) {
      testInfo.skip(
        true,
        "Set YOUTRAVEL_E2E_TOUR_SLUG to a YouTravel tour slug (…-yt{id})."
      );
    }

    void page.route(`**/api/partner-tours/${tourSlug}/schedule`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          dates: mockCapacityRegressionDates,
          configured: true,
          affiliateFallback: `/api/affiliate/go/${tourSlug}`,
        }),
      });
    });
  });

  test("capacity panel shows consistent booked/free counts", async ({ page }, testInfo) => {
    const response = await page.goto(`/tours/${tourSlug}`, {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });

    if (!response || response.status() === 404) {
      testInfo.skip(true, `Tour page /tours/${tourSlug} is not available in this environment.`);
    }

    const capacityPanel = page.locator("text=Уже едут").first();
    await expect(capacityPanel).toBeVisible({ timeout: 20_000 });

    await expect(page.getByText("Свободно", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("8", { exact: true }).first()).toBeVisible();

    const bookedStat = page
      .locator("text=Уже едут")
      .locator("..")
      .locator("..")
      .getByText("0", { exact: true });
    await expect(bookedStat).toBeVisible();
  });
});
