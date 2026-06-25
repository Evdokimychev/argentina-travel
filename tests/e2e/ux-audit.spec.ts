import { expect, test, type Page } from "@playwright/test";
import { AUTH_WALL_ROUTES, E2E_ROUTES, PUBLIC_ROUTES } from "./fixtures/e2e-routes";
import {
  appendUxViolation,
  assertModalCloseButton,
  expectAuthWall,
  findViewportOverflows,
  formatViolationSamples,
  hasHorizontalScroll,
  severityForCheck,
  viewportNameFromProject,
  waitForPageStable,
} from "./helpers/ux-audit";

test.describe.configure({ mode: "parallel" });

async function gotoRoute(page: Page, routePath: string): Promise<void> {
  const response = await page.goto(routePath, {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
  expect.soft(response, `No response for ${routePath}`).not.toBeNull();
  if (response) {
    expect.soft(response.status(), `HTTP ${response.status()} for ${routePath}`).toBeLessThan(400);
  }
  await waitForPageStable(page);
}

function recordViolation(
  viewport: string,
  route: string,
  check: Parameters<typeof appendUxViolation>[0]["check"],
  message: string,
  samples?: string[],
): void {
  appendUxViolation({
    route,
    viewport,
    check,
    severity: severityForCheck(check),
    message,
    samples,
  });
}

for (const route of PUBLIC_ROUTES) {
  test(`[ux-audit] ${route.path} horizontal-scroll`, async ({ page }, testInfo) => {
    const viewport = viewportNameFromProject(testInfo.project.name);
    test.skip(route.skipHorizontalScroll === true, "Route opts out of horizontal scroll check");

    await gotoRoute(page, route.path);

    const scroll = await hasHorizontalScroll(page);
    if (scroll.overflow) {
      recordViolation(
        viewport,
        route.path,
        "horizontal-scroll",
        `Горизонтальный скролл ${scroll.delta}px`,
      );
    }
    expect
      .soft(scroll.overflow, `Horizontal scroll on ${route.path} (+${scroll.delta}px)`)
      .toBe(false);
  });

  test(`[ux-audit] ${route.path} viewport-overflow`, async ({ page }, testInfo) => {
    const viewport = viewportNameFromProject(testInfo.project.name);

    await gotoRoute(page, route.path);

    const overflows = await findViewportOverflows(page);
    if (overflows.length > 0) {
      recordViolation(
        viewport,
        route.path,
        "viewport-overflow",
        `${overflows.length} элемент(ов) выходит за viewport`,
        formatViolationSamples(overflows),
      );
    }
    expect.soft(overflows, `Viewport overflow on ${route.path}`).toHaveLength(0);
  });
}

for (const route of AUTH_WALL_ROUTES) {
  test(`[ux-audit] ${route.path} auth-wall`, async ({ page }, testInfo) => {
    const viewport = viewportNameFromProject(testInfo.project.name);

    await gotoRoute(page, route.path);

    const hasWall = await expectAuthWall(page);
    if (!hasWall) {
      recordViolation(
        viewport,
        route.path,
        "auth-wall",
        "Страница кабинета не показывает экран входа для неавторизованного пользователя",
      );
    }
    expect.soft(hasWall, `Auth wall on ${route.path}`).toBe(true);
  });
}

test.describe("UX audit — modals", () => {
  test("[ux-audit] /?auth=sign-in modal-close-button", async ({ page }, testInfo) => {
    const viewport = viewportNameFromProject(testInfo.project.name);

    await gotoRoute(page, "/?auth=sign-in");
    await expect.soft(page.getByRole("dialog")).toBeVisible();

    const hasClose = await assertModalCloseButton(page);
    if (!hasClose) {
      recordViolation(
        viewport,
        "/?auth=sign-in",
        "modal-close-button",
        "Диалог авторизации без кнопки «Закрыть»",
      );
    }
    expect.soft(hasClose, "Auth modal close button").toBe(true);
  });

  test("[ux-audit] /tours modal-close-button", async ({ page }, testInfo) => {
    const viewport = viewportNameFromProject(testInfo.project.name);
    test.skip(viewport !== "mobile", "Filters sheet modal is mobile-only");

    await gotoRoute(page, "/tours");
    await page.getByRole("button", { name: /^Фильтры/i }).click();
    await expect.soft(page.getByRole("dialog")).toBeVisible();

    const hasClose = await assertModalCloseButton(page);
    if (!hasClose) {
      recordViolation(
        viewport,
        "/tours",
        "modal-close-button",
        "Sheet «Фильтры каталога» без кнопки «Закрыть»",
      );
    }
    expect.soft(hasClose, "Catalog filters sheet close button").toBe(true);
  });
});

test.describe("UX audit — navigation", () => {
  test.describe.configure({ mode: "serial" });

  test("[ux-audit] / navigation", async ({ page }, testInfo) => {
    const viewport = viewportNameFromProject(testInfo.project.name);

    await gotoRoute(page, "/");
    await page.goto("/tours", { waitUntil: "domcontentloaded" });
    await waitForPageStable(page);
    await expect.soft(page).toHaveURL(/\/tours/);

    await page.goBack({ waitUntil: "domcontentloaded" });
    await waitForPageStable(page);
    await expect.soft(page).toHaveURL((url) => url.pathname === "/");

    await page.goForward({ waitUntil: "domcontentloaded" });
    await waitForPageStable(page);
    await expect.soft(page).toHaveURL(/\/tours/);

    const scroll = await hasHorizontalScroll(page);
    if (scroll.overflow) {
      recordViolation(
        viewport,
        "/ → /tours",
        "navigation",
        `После back/forward остался горизонтальный скролл (+${scroll.delta}px)`,
      );
    }
    expect.soft(scroll.overflow, "No horizontal scroll after navigation").toBe(false);
  });
});

/** Sanity: manifest covers expected route volume. */
test("[ux-audit] route-manifest", async () => {
  expect(E2E_ROUTES.length).toBeGreaterThanOrEqual(80);
  expect(PUBLIC_ROUTES.length).toBeGreaterThan(40);
  expect(AUTH_WALL_ROUTES.length).toBeGreaterThan(20);
});
