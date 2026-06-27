import { expect, test } from "@playwright/test";

const tourSlug = process.env.YOUTRAVEL_E2E_TOUR_SLUG?.trim();

const mockScheduleDates = [
  {
    id: "yt-offer-e2e-0",
    startDate: "2026-09-10",
    endDate: "2026-09-15",
    spotsLeft: 6,
    priceUsd: 1200,
    partnerPriceValue: 1200,
    partnerPriceCurrency: "USD",
  },
];

test.describe("YouTravel booking smoke", () => {
  test.beforeEach(({ page }, testInfo) => {
    if (!tourSlug) {
      testInfo.skip(true, "Set YOUTRAVEL_E2E_TOUR_SLUG to a YouTravel tour slug (…-yt{id}).");
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

  test("date selection → submit → booking request accepted", async ({ page }, testInfo) => {
    const response = await page.goto(`/tours/${tourSlug}`, {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });

    if (!response || response.status() === 404) {
      testInfo.skip(true, `Tour page /tours/${tourSlug} is not available in this environment.`);
    }

    await expect(page.locator("#booking")).toBeVisible();

    const dateOption = page.getByRole("radio").first();
    await expect(dateOption).toBeVisible({ timeout: 20_000 });
    await dateOption.click();

    const bookingRequestPromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/youtravel/booking-request") && res.request().method() === "POST"
    );

    await page.getByRole("link", { name: /Забронировать на YouTravel\.me/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Контактные поля больше не собираются в форме (см. ENABLE_PARTNER_CONTACT_FORM):
    // дата и число туристов передаются партнёру, контакты турист заполняет на YouTravel.me.
    await page.getByRole("button", { name: /Подтвердить и забронировать/i }).click();

    const bookingResponse = await bookingRequestPromise;
    expect(bookingResponse.status()).toBeLessThan(500);

    const body = (await bookingResponse.json()) as {
      ok?: boolean;
      mode?: string;
      orderId?: string | null;
      fallbackUrl?: string;
    };

    expect(body.mode === "youtravel_order" || body.mode === "affiliate_fallback").toBe(true);
    if (body.mode === "youtravel_order") {
      expect(body.ok).toBe(true);
    }

    await expect(
      page.getByText(/Заявка принята|Открываем YouTravel\.me/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });
});
