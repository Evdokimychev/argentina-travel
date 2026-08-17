import { expect, test, type Page } from "@playwright/test";

/**
 * Sprint 4 — behavioural public journeys (outcomes, not DOM implementation).
 * Keep soft where partner/CMS soft-degrade may omit live inventory.
 */

async function dismissCookieBanner(page: Page) {
  const button = page.getByRole("button", {
    name: /^(Только нужные|Только необходимые|Принять все|Принять)$/i,
  });
  if (await button.isVisible().catch(() => false)) {
    await button.click({ timeout: 3_000 }).catch(() => undefined);
  }
}

async function gotoReady(page: Page, pathname: string) {
  const response = await page.goto(pathname, { waitUntil: "domcontentloaded", timeout: 90_000 });
  expect(response, `No response for ${pathname}`).not.toBeNull();
  expect(response!.status(), `Bad status for ${pathname}`).toBeLessThan(400);
  await expect(page.locator("body")).toBeVisible();
  await dismissCookieBanner(page);
}

test.describe("Sprint 4 public journeys", () => {
  test("A: home → tours catalog → tour detail", async ({ page }) => {
    await gotoReady(page, "/");
    await page.getByRole("link", { name: /туры/i }).first().click();
    await expect(page).toHaveURL(/\/tours/);
    await expect(page.locator("h1")).toBeVisible();

    const firstCard = page.locator('a[href^="/tours/"]').filter({ hasNot: page.locator('[href="/tours"]') }).first();
    if (!(await firstCard.isVisible().catch(() => false))) {
      test.info().annotations.push({ type: "note", description: "No tour cards (soft-degrade/empty)" });
      return;
    }

    await firstCard.click();
    await expect(page).toHaveURL(/\/tours\/.+/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("C: tours filters → results stay on catalog", async ({ page }) => {
    await gotoReady(page, "/tours");
    const filterControl = page.getByRole("button", { name: /фильтр|filters/i }).first();
    if (await filterControl.isVisible().catch(() => false)) {
      await filterControl.click();
      const dialog = page.getByRole("dialog").or(page.locator("[data-filters-sheet], [data-mobile-filters]"));
      if (await dialog.first().isVisible().catch(() => false)) {
        await page.keyboard.press("Escape");
      }
    }
    await expect(page).toHaveURL(/\/tours/);
    await expect(page.locator("main")).toBeVisible();
  });

  test("E: blog hub → article → related destinations stay navigable", async ({ page }) => {
    await gotoReady(page, "/blog");
    await expect(page.locator("h1")).toBeVisible();
    // Prefer catalog/card links — the mobile «С чего начать» strip is lg:hidden and is
    // often the first matching href in DOM order on desktop Playwright viewports.
    const article = page
      .locator(
        'article a[href^="/blog/"], a.blog-card[href^="/blog/"], main a[href^="/blog/"]:not(.blog-index-start-strip__link)',
      )
      .filter({ hasNot: page.locator('[href="/blog"]') })
      .first();
    await expect(article).toBeVisible();
    // Card media uses pointer-events-none so the stretch overlay link receives the click.
    await article.click();
    await expect(page).toHaveURL(/\/blog\/.+/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("B: destination → place catalog link", async ({ page }) => {
    await gotoReady(page, "/destinations/patagonia");
    await expect(page.locator("h1")).toBeVisible();
    const places = page.getByRole("link", { name: /места|достопримечательност|справочник/i }).first();
    if (await places.isVisible().catch(() => false)) {
      await places.click();
      await expect(page).toHaveURL(/\/(places|destinations|mapa)/);
    }
  });

  test("G: map shell loads without trapping the page", async ({ page }) => {
    await gotoReady(page, "/mapa-argentina");
    await expect(page.locator("main, [data-map-shell], #main-content").first()).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(page.locator("body")).toBeVisible();
  });

  test("H: mobile nav opens and closes with Escape", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoReady(page, "/");
    const menu = page.getByRole("button", { name: /меню|menu/i }).first();
    await expect(menu).toBeVisible();
    await menu.click();
    const overlay = page.locator("#site-nav-overlay, [data-site-nav-overlay], [role='dialog']").first();
    await expect(overlay).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press("Escape");
    await expect(overlay).toBeHidden({ timeout: 10_000 });
  });

  test("search dialog opens from header and closes with Escape", async ({ page }) => {
    await gotoReady(page, "/");
    const search = page.getByRole("button", { name: /поиск/i }).first();
    if (!(await search.isVisible().catch(() => false))) {
      test.skip(true, "Search control hidden by design flags");
      return;
    }
    await search.click();
    const dialog = page.getByRole("dialog").first();
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden({ timeout: 10_000 });
  });
});
