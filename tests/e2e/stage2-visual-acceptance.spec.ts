import { expect, test, type Page } from "@playwright/test";
import { hasHorizontalScroll, waitForPageStable } from "./helpers/ux-audit";

type AcceptanceRoute = {
  id: string;
  path: string;
  protected?: boolean;
};

const CRITICAL_ROUTES: AcceptanceRoute[] = [
  { id: "home", path: "/" },
  { id: "flights", path: "/flights" },
  { id: "map", path: "/mapa-argentina" },
  { id: "blog", path: "/blog" },
  { id: "article", path: "/blog/buenos-aires-rajony" },
  { id: "contacts", path: "/contacts" },
  { id: "auth", path: "/?auth=sign-in" },
  { id: "tour", path: "/tours/patagonia-glaciers" },
  { id: "checkout-recovery", path: "/booking/find" },
  { id: "profile", path: "/profile", protected: true },
  { id: "organizer", path: "/organizer", protected: true },
  { id: "organizer-article-editor", path: "/organizer/articles/new/edit", protected: true },
  { id: "admin", path: "/admin", protected: true },
  { id: "admin-content-editor", path: "/admin/content/documents", protected: true },
];

function collectCriticalBrowserErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on("pageerror", (error) => {
    // Chromium reports this benign third-party widget delivery warning as a page error.
    if (/^ResizeObserver loop completed with undelivered notifications\.?$/.test(error.message)) {
      return;
    }
    errors.push(`pageerror: ${error.message}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 500) {
      errors.push(`http ${response.status()}: ${response.url()}`);
    }
  });

  return errors;
}

test.describe("Stage 2 visual acceptance", () => {
  test.describe.configure({ mode: "parallel" });

  for (const route of CRITICAL_ROUTES) {
    test(`${route.id} renders without critical browser errors`, async ({ page }, testInfo) => {
      const browserErrors = collectCriticalBrowserErrors(page);
      const response = await page.goto(route.path, {
        waitUntil: "domcontentloaded",
        timeout: 90_000,
      });

      expect(response, `No response for ${route.path}`).not.toBeNull();
      expect(response?.status(), `HTTP ${response?.status()} for ${route.path}`).toBeLessThan(400);
      await waitForPageStable(page);
      await expect(page.locator("body")).toBeVisible();

      if (route.path === "/flights") {
        await expect(page.locator('[data-widget-status="loading"]')).toHaveCount(0, {
          timeout: 15_000,
        });
      }

      const visibleLoadingStates = await page.getByText(/^Загружаем/i).evaluateAll((elements) =>
        elements.filter((element) => {
          if (element.classList.contains("sr-only")) return false;
          const style = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== "none" && style.visibility !== "hidden" && rect.height > 0;
        }).length,
      );
      expect(visibleLoadingStates, `A stale loading state remains visible on ${route.path}`).toBe(0);

      if (route.path === "/contacts") {
        await expect(page.getByText("Основной офис и команда на месте")).toHaveCount(1);
      }

      if (route.protected) {
        await expect(
          page.getByText(/вход|войдите|авторизац|нет доступа/i).first(),
          `Protected route ${route.path} has no visible access boundary`,
        ).toBeVisible();
      }

      const horizontalScroll = await hasHorizontalScroll(page);
      expect(horizontalScroll.overflow, `Horizontal scroll on ${route.path}`).toBe(false);

      const screenshotName = `${testInfo.project.name}-${route.id}.png`;
      await page.screenshot({
        path: testInfo.outputPath(screenshotName),
        fullPage: false,
        animations: "disabled",
      });

      expect(browserErrors, browserErrors.join("\n")).toEqual([]);
    });
  }
});
