import { expect, test } from "@playwright/test";

const MOBILE_FLIGHT_CASES = [
  { name: "iPhone SE", width: 320, height: 568 },
  { name: "iPhone 13/14", width: 390, height: 844 },
  { name: "Pixel 7", width: 412, height: 915 },
  { name: "iPad", width: 768, height: 1024 },
] as const;

for (const device of MOBILE_FLIGHT_CASES) {
  test(`[flights-mobile] ${device.name}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: device.width, height: device.height });
    await page.goto("/flights?origin=MOW&destination=BUE", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const search = document.querySelector<HTMLElement>("#tpwl-search");
            const button = search?.shadowRoot?.querySelector<HTMLElement>(
              '[class*="DefaultSearch-module__submitBtn"]',
            );
            return Boolean(button || document.querySelector('[role="alert"]'));
          }),
        { timeout: 20_000 },
      )
      .toBe(true);

    const geometry = await page.evaluate(() => {
      const root = document.querySelector<HTMLElement>("#tpwl-search");
      const button = root?.shadowRoot?.querySelector<HTMLElement>(
        '[class*="DefaultSearch-module__submitBtn"]',
      );
      const rootRect = root?.getBoundingClientRect();
      const buttonRect = button?.getBoundingClientRect();
      return {
        documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        hasFallback: Boolean(document.querySelector('[role="alert"]')),
        rootLeft: rootRect?.left ?? null,
        rootRight: rootRect?.right ?? null,
        buttonLeft: buttonRect?.left ?? null,
        buttonRight: buttonRect?.right ?? null,
      };
    });

    expect(geometry.documentOverflow).toBeLessThanOrEqual(1);
    if (!geometry.hasFallback) {
      expect(geometry.buttonLeft).not.toBeNull();
      expect(geometry.buttonRight).not.toBeNull();
      expect(geometry.buttonLeft!).toBeGreaterThanOrEqual(geometry.rootLeft! - 1);
      expect(geometry.buttonRight!).toBeLessThanOrEqual(geometry.rootRight! + 1);
    }
  });
}
