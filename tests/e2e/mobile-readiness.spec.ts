import { expect, test, type Page, type TestInfo } from "@playwright/test";

const MOBILE_VIEWPORTS = [
  { name: "small", width: 320, height: 568 },
  { name: "standard", width: 390, height: 844 },
  { name: "large", width: 430, height: 932 },
] as const;

async function acceptNecessaryCookies(page: Page) {
  const button = page.getByRole("button", {
    name: /^(Только нужные|Только необходимые)$/,
  });
  if (await button.isVisible().catch(() => false)) {
    await button.click();
  }
}

async function expectMobileGeometry(page: Page, testInfo: TestInfo) {
  const geometry = await page.evaluate(() => {
    const visibleFixed = Array.from(document.querySelectorAll<HTMLElement>("body *"))
      .filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.position === "fixed" && rect.width > 0 && rect.height > 0;
      })
      .map((element) => ({
        label: element.getAttribute("aria-label") ?? element.tagName,
        left: element.getBoundingClientRect().left,
        right: element.getBoundingClientRect().right,
      }));

    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      fixedOutsideViewport: visibleFixed.filter(
        (item) => item.left < -1 || item.right > window.innerWidth + 1,
      ),
    };
  });

  expect(geometry.overflow, `${testInfo.title}: horizontal overflow`).toBeLessThanOrEqual(1);
  expect(geometry.fixedOutsideViewport, `${testInfo.title}: fixed controls outside viewport`).toEqual([]);
}

async function expectLoadedVisibleImages(page: Page, testInfo: TestInfo) {
  const broken = await page.locator("img:visible").evaluateAll((elements) =>
    (elements as HTMLImageElement[])
      .filter((image) => image.getBoundingClientRect().height > 8)
      .filter((image) => !image.complete || image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.getAttribute("src") || "unknown"),
  );
  expect(broken, `${testInfo.title}: broken visible images`).toEqual([]);
}

for (const viewport of MOBILE_VIEWPORTS) {
  test(`[mobile-readiness] ${viewport.name} public app shell`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await page.setViewportSize(viewport);

    const failedImageResponses: Array<{ status: number; url: string }> = [];
    page.on("response", (response) => {
      const url = response.url();
      if (
        response.status() >= 400 &&
        (response.request().resourceType() === "image" ||
          url.includes("/_next/image") ||
          url.includes("/api/media/partner-image"))
      ) {
        failedImageResponses.push({ status: response.status(), url });
      }
    });

    for (const pathname of ["/", "/tours", "/blog", "/mapa-argentina"]) {
      const response = await page.goto(pathname, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      expect(response?.status(), pathname).toBeLessThan(400);
      await acceptNecessaryCookies(page);
      await page.waitForTimeout(pathname === "/mapa-argentina" ? 2_000 : 750);

      await expectMobileGeometry(page, testInfo);
      await expectLoadedVisibleImages(page, testInfo);

      const mobileNav = page.getByRole("navigation", { name: "Основная навигация" });
      await expect(mobileNav).toBeVisible();
      const navTargets = await mobileNav.locator("a").evaluateAll((links) =>
        links.map((link) => link.getBoundingClientRect().height),
      );
      expect(navTargets.every((height) => height >= 44)).toBe(true);
    }

    await expect(page.getByRole("button", { name: "Поиск и фильтры карты" })).toBeVisible();
    expect(failedImageResponses).toEqual([]);
  });
}

test("[mobile-readiness] tour detail owns the bottom action", async ({ page, request }, testInfo) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });

  const sitemapResponse = await request.get("/sitemap.xml");
  expect(sitemapResponse.ok()).toBe(true);
  const sitemap = await sitemapResponse.text();
  const detailUrl = sitemap.match(/<loc>([^<]+\/tours\/[^/<]+)<\/loc>/)?.[1];
  expect(detailUrl, "A public tour detail must exist in the sitemap").toBeTruthy();

  const pathname = new URL(detailUrl!).pathname;
  const response = await page.goto(pathname, { waitUntil: "domcontentloaded", timeout: 60_000 });
  expect(response?.status()).toBeLessThan(400);
  await acceptNecessaryCookies(page);
  await page.waitForTimeout(1_000);

  await expectMobileGeometry(page, testInfo);
  await expectLoadedVisibleImages(page, testInfo);
  await expect(page.getByRole("navigation", { name: "Основная навигация" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Изменить дату и туристов|Свернуть выбор/ })).toBeVisible();
});
