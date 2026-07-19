import { expect, test, type Locator } from "@playwright/test";

const consent = JSON.stringify({
  version: 2,
  necessary: true,
  analytics: false,
  personalization: false,
  decidedAt: "2026-07-18T00:00:00.000Z",
  expiresAt: "2027-07-18T00:00:00.000Z",
});

async function waitForReactReady(locator: Locator) {
  await expect
    .poll(
      () =>
        locator.evaluate((element) =>
          Object.keys(element).some((key) => key.startsWith("__reactProps$")),
        ),
      { timeout: 45_000 },
    )
    .toBe(true);
}

test.describe("Tours reference UX — mobile", () => {
  test.describe.configure({ mode: "serial", timeout: 120_000 });
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((value) => {
      window.localStorage.setItem("site-cookie-consent", value);
      window.localStorage.setItem("pwa-visit-count", "5");
    }, consent);
  });

  test("catalog keeps filters predictable and cards compact", async ({ page }) => {
    await page.goto("/tours", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("путешествие");
    const cheaperSort = page.getByRole("button", { name: "Дешевле" });
    await waitForReactReady(cheaperSort);
    await cheaperSort.click();
    await expect(page).toHaveURL(/(?:\?|&)sort=price_asc(?:&|$)/);

    const filterButton = page.getByRole("button", { name: /^Фильтры/i });
    await expect(filterButton).toBeVisible();
    await filterButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Сбросить" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: /^Показать \d+ тур/ })).toBeVisible();
    await dialog.getByRole("button", { name: /^Показать \d+ тур/ }).click();
    await expect(dialog).toBeHidden();

    const firstCard = page.locator(".catalog-listing-page-results-grid article").first();
    await expect(firstCard).toBeVisible();
    const cardBox = await firstCard.boundingBox();
    expect(cardBox?.height ?? Infinity).toBeLessThan(500);

    const cardLink = firstCard.locator('a[href^="/tours/"]').first();
    await cardLink.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/tours\//);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 45_000 });
  });

  test("tour exposes gallery, program and the mobile booking action", async ({ page }) => {
    await page.goto(
      "/tours/mnogo-trekkinga-v-patagonii-kruizy-na-korablyah-ushuayya-i-iguasu-yt52537",
      {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
      },
    );

    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible({ timeout: 45_000 });
    await expect(page.getByRole("dialog", { name: "Установить приложение" })).toHaveCount(0);
    await page.waitForTimeout(1_000);
    expect((await heading.boundingBox())?.height ?? Infinity).toBeLessThan(180);

    const galleryAction = page.getByRole("button", { name: /^Все фото/ });
    if (await galleryAction.isVisible()) {
      await waitForReactReady(galleryAction);
      await galleryAction.click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.mouse.click(8, 420);
      await expect(page.getByRole("dialog")).toBeHidden();
    }

    const program = page.locator("#itinerary");
    await program.scrollIntoViewIfNeeded();
    await expect(program).toBeVisible();
    const dayToggle = program.locator("button[aria-expanded]").first();
    await expect(dayToggle).toBeVisible();
    await dayToggle.click();

    const bookingAction = page
      .getByRole("button", { name: /Забронировать|Перейти к бронированию|Выбрать дату/i })
      .or(page.getByRole("link", { name: /Забронировать|Перейти к бронированию|Выбрать дату/i }));
    await expect(bookingAction).toBeVisible();
    await expect(bookingAction.locator("..")).toContainText(/\$|€|₽|ARS/);
  });

  test("mobile menu opens without horizontal overflow", async ({ page }) => {
    await page.goto("/tours", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const cheaperSort = page.getByRole("button", { name: "Дешевле" });
    await waitForReactReady(cheaperSort);
    await cheaperSort.click();
    await expect(page).toHaveURL(/(?:\?|&)sort=price_asc(?:&|$)/);
    await page.getByRole("button", { name: "Меню" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
