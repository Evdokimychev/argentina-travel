#!/usr/bin/env node

import { chromium, devices } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "research/third-party/manifest.json");
const outputRoot = path.join(root, "research/third-party");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...value] = arg.replace(/^--/, "").split("=");
    return [key, value.join("=") || "true"];
  }),
);

const selectedPages = manifest.pages.filter((page) => {
  if (args.has("site") && page.site !== args.get("site")) return false;
  if (args.has("page") && page.id !== args.get("page")) return false;
  return true;
});
const selectedViewports = manifest.viewports.filter(
  (viewport) => !args.has("viewport") || viewport.id === args.get("viewport"),
);

if (selectedPages.length === 0 || selectedViewports.length === 0) {
  throw new Error("Не найдены страницы или viewport по указанным параметрам.");
}

const browser = await chromium.launch({ headless: true });
const runStartedAt = new Date().toISOString();
const results = [];

const cleanText = (value) => (value || "").replace(/\s+/g, " ").trim();

async function scrollForLazyContent(page) {
  await page.evaluate(async () => {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    const step = Math.max(500, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < height; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await delay(70);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    await delay(160);
  });
}

async function collectStructure(page) {
  return page.evaluate(() => {
    const text = (node) => (node?.textContent || "").replace(/\s+/g, " ").trim();
    const box = (node) => {
      const rect = node.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    };
    const project = (selector, limit = 120) =>
      [...document.querySelectorAll(selector)].slice(0, limit).map((node) => ({
        tag: node.tagName.toLowerCase(),
        text: text(node).slice(0, 240),
        role: node.getAttribute("role"),
        ariaLabel: node.getAttribute("aria-label"),
        href: node.getAttribute("href"),
        type: node.getAttribute("type"),
        name: node.getAttribute("name"),
        placeholder: node.getAttribute("placeholder"),
        checked: "checked" in node ? node.checked : undefined,
        disabled: "disabled" in node ? node.disabled : undefined,
        box: box(node),
      }));
    const cardSelectors = [
      "article",
      "[class*='card']",
      "[class*='Card']",
      "[data-testid*='card']",
      "[class*='tour-item']",
    ];
    const cards = [...new Set(cardSelectors.flatMap((selector) => [...document.querySelectorAll(selector)]))]
      .filter((node) => node.getBoundingClientRect().width > 140 && text(node).length > 20)
      .slice(0, 40)
      .map((node) => ({ tag: node.tagName.toLowerCase(), text: text(node).slice(0, 320), box: box(node) }));

    return {
      title: document.title,
      url: location.href,
      lang: document.documentElement.lang,
      documentSize: {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      },
      landmarks: project("header,nav,main,aside,footer,[role='navigation'],[role='main'],[role='dialog']", 60),
      headings: project("h1,h2,h3,h4,h5,h6", 100),
      buttons: project("button,[role='button']"),
      links: project("a[href]"),
      forms: project("form", 30),
      controls: project("input,select,textarea,[role='checkbox'],[role='radio'],[role='tab']"),
      dialogs: project("dialog,[role='dialog']", 20),
      accordions: project("details,[aria-expanded]", 60),
      images: [...document.images].slice(0, 120).map((image) => ({
        src: image.currentSrc || image.src,
        alt: image.alt,
        width: image.naturalWidth,
        height: image.naturalHeight,
        box: box(image),
      })),
      cards,
    };
  });
}

async function collectStyles(page) {
  return page.evaluate(() => {
    const selectors = {
      header: "header",
      navigation: "nav",
      search: "input[type='search'],[class*='search'],[class*='Search']",
      filters: "[class*='filter'],[class*='Filter']",
      buttons: "button,[role='button']",
      inputs: "input,select,textarea",
      cards: "article,[class*='card'],[class*='Card']",
      badges: "[class*='badge'],[class*='Badge']",
      prices: "[class*='price'],[class*='Price']",
      gallery: "[class*='gallery'],[class*='Gallery']",
      itinerary: "[class*='itinerary'],[class*='program'],[class*='route']",
      organizer: "[class*='organizer'],[class*='expert'],[class*='provider']",
      booking: "[class*='booking'],[class*='Booking']",
      footer: "footer",
    };
    const props = [
      "display", "position", "top", "right", "bottom", "left", "width", "max-width",
      "min-height", "grid-template-columns", "gap", "padding", "margin", "font-family",
      "font-size", "font-weight", "line-height", "letter-spacing", "color",
      "background-color", "border", "border-radius", "box-shadow", "overflow", "z-index",
      "object-fit", "aspect-ratio",
    ];
    return Object.fromEntries(Object.entries(selectors).map(([key, selector]) => {
      const nodes = [...document.querySelectorAll(selector)].filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).slice(0, 12);
      return [key, nodes.map((node) => {
        const style = getComputedStyle(node);
        return {
          tag: node.tagName.toLowerCase(),
          text: (node.textContent || "").replace(/\s+/g, " ").trim().slice(0, 120),
          styles: Object.fromEntries(props.map((prop) => [prop, style.getPropertyValue(prop)])),
        };
      })];
    }));
  });
}

async function collectAssets(page) {
  return page.evaluate(() => {
    const rows = [];
    const add = (type, url) => url && rows.push({ type, url: new URL(url, location.href).href });
    document.querySelectorAll("link[rel='stylesheet']").forEach((node) => add("stylesheet", node.href));
    document.querySelectorAll("script[src]").forEach((node) => add("script", node.src));
    document.querySelectorAll("link[rel='preload'][as='font']").forEach((node) => add("font", node.href));
    document.querySelectorAll("img[src],source[srcset]").forEach((node) => {
      const raw = node.currentSrc || node.src || node.srcset?.split(",")[0]?.trim().split(" ")[0];
      add("image", raw);
    });
    document.querySelectorAll("video[src],audio[src],source[src]").forEach((node) => add("media", node.src));
    return [...new Map(rows.map((row) => [`${row.type}:${row.url}`, row])).values()];
  });
}

async function captureInteractiveStates(page, pageEntry, viewport, target) {
  const captured = ["default"];
  const tryState = async (name, locator) => {
    try {
      if ((await locator.count()) !== 1 || !(await locator.isVisible())) return;
      await locator.click({ timeout: 5_000 });
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(target, `state-${name}.png`) });
      captured.push(name);
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(120);
    } catch {
      // Public state may be absent or represented by a non-button control.
    }
  };

  if (pageEntry.type.includes("catalog")) {
    await tryState("sort-open", page.getByRole("button", { name: "По популярности", exact: true }));
    await tryState("filters-open", page.getByRole("button", { name: "Фильтры", exact: true }));
  }
  if (pageEntry.type === "tour-detail") {
    await tryState("gallery-open", page.getByRole("button", { name: /Все фото/i }).first());
    await tryState("program-expanded", page.getByRole("button", { name: /Раскрыть все/i }).first());
  }
  if (viewport.mobile) {
    const menu = page.locator('button[aria-label*="меню" i],button[aria-label*="menu" i]');
    if ((await menu.count()) === 1) await tryState("mobile-menu-open", menu);
  }
  return captured;
}

for (const pageEntry of selectedPages) {
  for (const viewport of selectedViewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.mobile ? 2 : 1,
      isMobile: Boolean(viewport.mobile),
      hasTouch: Boolean(viewport.mobile),
      userAgent: viewport.mobile ? devices["iPhone 13"].userAgent : undefined,
      locale: "ru-RU",
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();
    const target = path.join(outputRoot, pageEntry.site, pageEntry.id, viewport.id);
    await mkdir(target, { recursive: true });
    const startedAt = new Date().toISOString();

    try {
      const response = await page.goto(pageEntry.url, { waitUntil: "domcontentloaded", timeout: 45_000 });
      const status = response?.status() ?? null;
      const source = response ? await response.text().catch(() => "") : "";
      await page.locator("main,body").first().waitFor({ state: "visible", timeout: 15_000 }).catch(() => {});
      await scrollForLazyContent(page);

      await Promise.all([
        writeFile(path.join(target, "source.html"), source),
        writeFile(path.join(target, "dom.html"), await page.content()),
        writeFile(path.join(target, "structure.json"), JSON.stringify(await collectStructure(page), null, 2)),
        writeFile(path.join(target, "computed-styles.json"), JSON.stringify(await collectStyles(page), null, 2)),
        writeFile(path.join(target, "assets.json"), JSON.stringify(await collectAssets(page), null, 2)),
        page.screenshot({ path: path.join(target, "above-the-fold.png") }),
        page.screenshot({ path: path.join(target, "full-page.png"), fullPage: true }),
      ]);

      const interactiveStates = await captureInteractiveStates(page, pageEntry, viewport, target);

      if (typeof page.locator("body").ariaSnapshot === "function") {
        const aria = await page.locator("body").ariaSnapshot({ timeout: 10_000 }).catch(() => "");
        if (aria) await writeFile(path.join(target, "aria-snapshot.yml"), aria);
      }

      const meta = {
        sourceUrl: pageEntry.url,
        finalUrl: page.url(),
        title: await page.title(),
        researchedAt: startedAt,
        httpStatus: status,
        viewport,
        pageType: pageEntry.type,
        interactiveStates,
      };
      await writeFile(path.join(target, "meta.json"), JSON.stringify(meta, null, 2));
      results.push({ ...meta, site: pageEntry.site, id: pageEntry.id, ok: true });
      process.stdout.write(`✓ ${pageEntry.site}/${pageEntry.id}/${viewport.id}\n`);
    } catch (error) {
      const failure = {
        sourceUrl: pageEntry.url,
        researchedAt: startedAt,
        viewport,
        pageType: pageEntry.type,
        error: cleanText(error instanceof Error ? error.message : String(error)),
      };
      await writeFile(path.join(target, "error.json"), JSON.stringify(failure, null, 2));
      results.push({ ...failure, site: pageEntry.site, id: pageEntry.id, ok: false });
      process.stdout.write(`✗ ${pageEntry.site}/${pageEntry.id}/${viewport.id}: ${failure.error}\n`);
    } finally {
      await context.close();
    }
  }
}

await browser.close();
await writeFile(
  path.join(outputRoot, "capture-run.json"),
  JSON.stringify({ runStartedAt, runFinishedAt: new Date().toISOString(), results }, null, 2),
);

const failed = results.filter((result) => !result.ok).length;
process.stdout.write(`Готово: ${results.length - failed}/${results.length}, ошибок: ${failed}\n`);
if (failed > 0) process.exitCode = 1;
