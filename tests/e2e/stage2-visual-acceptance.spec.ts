import { expect, test, type Page } from "@playwright/test";
import { expectAuthWall, hasHorizontalScroll, waitForPageStable } from "./helpers/ux-audit";

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
  { id: "tour", path: "/tours" },
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

async function resolveAcceptancePath(page: Page, route: AcceptanceRoute): Promise<string> {
  if (route.id !== "tour") return route.path;

  const catalogResponse = await page.goto("/tours", {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
  expect(catalogResponse?.status(), "Tour catalog is not available").toBeLessThan(400);
  await waitForPageStable(page);

  const href = await page.locator('a[href^="/tours/"]').first().getAttribute("href");
  expect(href, "Tour catalog has no published detail route").toMatch(/^\/tours\//);
  return href!;
}

test.describe("Stage 2 visual acceptance", () => {
  test.describe.configure({ mode: "parallel" });

  for (const route of CRITICAL_ROUTES) {
    test(`${route.id} renders without critical browser errors`, async ({ page }, testInfo) => {
      const browserErrors = collectCriticalBrowserErrors(page);
      const resolvedPath = await resolveAcceptancePath(page, route);
      const response = await page.goto(resolvedPath, {
        waitUntil: "domcontentloaded",
        timeout: 90_000,
      });

      expect(response, `No response for ${resolvedPath}`).not.toBeNull();
      expect(response?.status(), `HTTP ${response?.status()} for ${resolvedPath}`).toBeLessThan(400);
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
        expect(
          await expectAuthWall(page),
          `Protected route ${resolvedPath} has no visible access boundary`,
        ).toBe(true);
      }

      const horizontalScroll = await hasHorizontalScroll(page);
      expect(horizontalScroll.overflow, `Horizontal scroll on ${resolvedPath}`).toBe(false);

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
