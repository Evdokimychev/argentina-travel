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
        (item) =>
          item.right > 0 &&
          item.left < window.innerWidth &&
          (item.left < -1 || item.right > window.innerWidth + 1),
      ),
    };
  });

  expect(geometry.overflow, `${testInfo.title}: horizontal overflow`).toBeLessThanOrEqual(1);
  expect(geometry.fixedOutsideViewport, `${testInfo.title}: fixed controls outside viewport`).toEqual([]);
}

async function expectCompactMobileActions(page: Page, testInfo: TestInfo) {
  const issues = await page.locator("button:visible, a:visible").evaluateAll((elements) =>
    (elements as HTMLElement[])
      .map((element) => {
        const text = (element.textContent ?? "").replace(/\s+/g, " ").trim();
        const rect = element.getBoundingClientRect();
        const className = element.className?.toString() ?? "";
        const isAction =
          element.tagName === "BUTTON" ||
          className.includes("rounded-button") ||
          className.includes("bg-sky-ink");
        return {
          text,
          width: rect.width,
          inViewport:
            rect.right > 0 &&
            rect.left < window.innerWidth &&
            rect.bottom > 0 &&
            rect.top < window.innerHeight,
          isAction,
          clipped:
            text.length >= 4 &&
            (element.scrollWidth > element.clientWidth + 1 ||
              element.scrollHeight > element.clientHeight + 1),
        };
      })
      .filter((item) => item.width >= 44 && item.inViewport && item.isAction && item.clipped)
      .filter((item) => !/^\d+\s+Issues?$/i.test(item.text)),
  );

  expect(issues, `${testInfo.title}: clipped mobile actions`).toEqual([]);
}

async function expectLoadedVisibleImages(page: Page, testInfo: TestInfo) {
  await expect
    .poll(
      () =>
        page.locator("img:visible").evaluateAll((elements) =>
          (elements as HTMLImageElement[])
            .filter((image) => {
              const rect = image.getBoundingClientRect();
              return (
                rect.height > 8 &&
                rect.right > 0 &&
                rect.left < window.innerWidth &&
                rect.bottom > 0 &&
                rect.top < window.innerHeight
              );
            })
            .filter((image) => !image.complete || image.naturalWidth === 0)
            .map((image) => image.currentSrc || image.getAttribute("src") || "unknown"),
        ),
      { message: `${testInfo.title}: broken visible images`, timeout: 10_000 },
    )
    .toEqual([]);
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
      await expectCompactMobileActions(page, testInfo);
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

test("[mobile-readiness] tour detail owns the bottom action", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });

  const catalogResponse = await page.goto("/tours", {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  expect(catalogResponse?.status()).toBeLessThan(400);
  const detailLink = page
    .locator('a[href^="/tours/"]:not([href^="/tours/region/"])')
    .first();
  const isProductionAcceptance = /^https:\/\/www\.goargentina\.ru\/?$/i.test(
    process.env.PLAYWRIGHT_BASE_URL?.trim() || process.env.SMOKE_BASE_URL?.trim() || "",
  );
  await detailLink
    .waitFor({ state: "attached", timeout: isProductionAcceptance ? 15_000 : 2_000 })
    .catch(() => undefined);
  const catalogDetailHref = await detailLink.getAttribute("href").catch(() => null);
  if (isProductionAcceptance) {
    expect(catalogDetailHref, "Production catalog must expose a real tour detail").toBeTruthy();
  }
  // CI intentionally runs without production partner credentials, so its
  // catalog can be empty. The production acceptance run exercises a real
  // listing; do not invent a bookable tour in the isolated CI environment.
  test.skip(!catalogDetailHref, "Partner catalog is intentionally unavailable in isolated CI");
  if (!catalogDetailHref) return;

  const pathname = new URL(catalogDetailHref, "https://www.goargentina.ru").pathname;
  const response = await page.goto(pathname, { waitUntil: "domcontentloaded", timeout: 60_000 });
  expect(response?.status()).toBeLessThan(400);
  await acceptNecessaryCookies(page);
  await page.waitForTimeout(1_000);

  await expectMobileGeometry(page, testInfo);
  await expectCompactMobileActions(page, testInfo);
  await expectLoadedVisibleImages(page, testInfo);
  await expect(page.getByRole("navigation", { name: "Основная навигация" })).toHaveCount(0);
  await expect(page.locator("h1")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Изменить дату и туристов|Свернуть выбор/ }),
  ).toBeVisible();
});
