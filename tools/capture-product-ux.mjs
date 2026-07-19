#!/usr/bin/env node

import { chromium, devices } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL?.trim() || "http://127.0.0.1:3000";
const outputRoot = path.join(process.cwd(), "test-results/reference-ux");
const allViewports = [
  { id: "desktop-wide", width: 1440, height: 1100 },
  { id: "desktop", width: 1280, height: 900 },
  { id: "tablet", width: 768, height: 1024 },
  { id: "mobile", width: 390, height: 844, mobile: true },
  { id: "small-mobile", width: 360, height: 800, mobile: true },
];
const allRoutes = [
  { id: "home", pathname: "/" },
  { id: "tours", pathname: "/tours" },
  {
    id: "tour",
    pathname: "/tours/mnogo-trekkinga-v-patagonii-kruizy-na-korablyah-ushuayya-i-iguasu-yt52537",
  },
  { id: "organizer", pathname: "/organizers/ivan-evdokimychev" },
  { id: "experts", pathname: "/experts" },
  { id: "blog", pathname: "/blog" },
  { id: "article", pathname: "/blog/buenos-aires-rajony" },
];
const requestedViewports = new Set(
  (process.env.CAPTURE_VIEWPORTS ?? "").split(",").map((value) => value.trim()).filter(Boolean),
);
const requestedRoutes = new Set(
  (process.env.CAPTURE_ROUTES ?? "").split(",").map((value) => value.trim()).filter(Boolean),
);
const viewports = requestedViewports.size
  ? allViewports.filter((viewport) => requestedViewports.has(viewport.id))
  : allViewports;
const routes = requestedRoutes.size
  ? allRoutes.filter((route) => requestedRoutes.has(route.id))
  : allRoutes;
const consent = JSON.stringify({
  version: 2,
  necessary: true,
  analytics: false,
  personalization: false,
  decidedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
});

async function waitForReactReady(locator) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const ready = await locator
      .evaluate((element) =>
        Object.keys(element).some((key) => key.startsWith("__reactProps$")),
      )
      .catch(() => false);
    if (ready) return;
    await locator.page().waitForTimeout(500);
  }
  throw new Error("Interactive control did not hydrate in time");
}

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
const selectedKeys = new Set(
  viewports.flatMap((viewport) => routes.map((route) => `${route.id}:${viewport.id}`)),
);
let results = [];
if (requestedViewports.size || requestedRoutes.size) {
  try {
    const existing = JSON.parse(await readFile(path.join(outputRoot, "manifest.json"), "utf8"));
    results = existing.filter(
      (result) => !selectedKeys.has(`${result.route.id}:${result.viewport.id}`),
    );
  } catch {
    results = [];
  }
}

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: Boolean(viewport.mobile),
    hasTouch: Boolean(viewport.mobile),
    deviceScaleFactor: viewport.mobile ? 2 : 1,
    userAgent: viewport.mobile ? devices["iPhone 13"].userAgent : undefined,
    locale: "ru-RU",
  });
  await context.addInitScript((value) => {
    window.localStorage.setItem("site-cookie-consent", value);
    window.localStorage.setItem("pwa-install-dismissed", "1");
  }, consent);

  for (const route of routes) {
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    const target = path.join(outputRoot, route.id, viewport.id);
    await mkdir(target, { recursive: true });
    try {
      const response = await page.goto(`${baseUrl}${route.pathname}`, {
        waitUntil: "domcontentloaded",
        timeout: 90_000,
      });
      await page.locator("main").first().waitFor({ state: "visible", timeout: 45_000 });
      await page.waitForTimeout(1_500);
      await page.screenshot({ path: path.join(target, "above-the-fold.png") });
      await page.screenshot({ path: path.join(target, "full-page.png"), fullPage: true });

      if (route.id === "tour" && viewport.mobile) {
        await page.evaluate(() => window.scrollTo(0, 0));
        const galleryAction = page.getByRole("button", { name: /^Все фото/ });
        if (await galleryAction.isVisible()) {
          await waitForReactReady(galleryAction);
          await galleryAction.click();
          const galleryDialog = page.getByRole("dialog", { name: /Просмотр фото/ });
          await galleryDialog.waitFor({ state: "visible" });
          await galleryDialog
            .locator("img")
            .first()
            .evaluate((image) => {
              if (image.complete && image.naturalWidth > 0) return;
              return new Promise((resolve) => {
                const done = () => resolve(undefined);
                image.addEventListener("load", done, { once: true });
                image.addEventListener("error", done, { once: true });
                window.setTimeout(done, 10_000);
              });
            })
            .catch(() => undefined);
          await page.screenshot({ path: path.join(target, "state-gallery-open.png") });
          await page.mouse.click(8, Math.round(viewport.height / 2));
          await galleryDialog.waitFor({ state: "hidden" });
        }

        const bookingSummary = page.getByRole("button", { name: /турист/ }).last();
        if (await bookingSummary.isVisible()) {
          await bookingSummary.click();
          await page.screenshot({ path: path.join(target, "state-booking-expanded.png") });
        }
      }
      const layout = await page.evaluate(() => ({
        title: document.title,
        url: location.href,
        viewportWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        h1: document.querySelector("h1")?.textContent?.replace(/\s+/g, " ").trim() || null,
      }));
      results.push({ route, viewport, status: response?.status(), layout, consoleErrors });
      process.stdout.write(`✓ ${route.id}/${viewport.id}\n`);
    } catch (error) {
      results.push({
        route,
        viewport,
        error: error instanceof Error ? error.message : String(error),
        consoleErrors,
      });
      process.stdout.write(`✗ ${route.id}/${viewport.id}\n`);
    } finally {
      await page.close();
    }
  }
  await context.close();
}

await browser.close();
await writeFile(path.join(outputRoot, "manifest.json"), JSON.stringify(results, null, 2));
if (results.some((result) => result.error)) process.exitCode = 1;
