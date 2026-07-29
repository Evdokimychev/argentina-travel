#!/usr/bin/env node
/**
 * E81: Production cutover smoke checks.
 *
 * Проверяет /api/health и ключевые публичные страницы.
 * При любой ошибке завершает процесс с кодом 1.
 *
 * Optional env:
 * - SMOKE_BASE_URL=https://www.goargentina.ru
 * - SMOKE_TIMEOUT_MS=15000
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  requestSmokeDocument,
  verifyCommercialCatalogFromHtml,
} from "./lib/commercial-catalog-smoke.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const baseUrl = (process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const timeoutMs = Number.parseInt(process.env.SMOKE_TIMEOUT_MS ?? "15000", 10);
const isCanonicalProduction = /^https:\/\/(?:www\.)?goargentina\.ru$/i.test(baseUrl);

const PAGE_PATHS = [
  "/",
  "/tours",
  "/excursions",
  "/destinations",
  "/places",
  "/blog",
  "/blog/buenos-aires-rajony",
  "/blog/natsionalnyy-park-iguasu",
  "/guide/sezony-i-klimat",
  "/destinations/patagonia",
  "/places/iguazu-falls",
  "/gallery",
  "/collections",
  "/immigration",
  "/mapa-argentina",
];

function loadEnvLocal() {
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(root, file);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function truncate(text, max = 240) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

async function get(pathname, stage = "request") {
  return requestSmokeDocument({ baseUrl, pathname, stage, timeoutMs });
}

async function checkHealth() {
  const health = await get("/api/health", "health");
  assert(
    health.status === 200 || health.status === 503,
    `GET /api/health returned ${health.status}: ${truncate(health.text)}`,
  );

  let json = null;
  try {
    json = health.text ? JSON.parse(health.text) : null;
  } catch {
    throw new Error(`GET /api/health did not return JSON: ${truncate(health.text)}`);
  }

  assert(json && typeof json === "object", "Health response must be an object.");
  assert(typeof json.version === "string", "Health response must include version.");
  assert(
    json.environment &&
      typeof json.environment.nodeEnv === "string" &&
      typeof json.environment.deployEnv === "string",
    "Health response must include environment.nodeEnv and environment.deployEnv."
  );
  assert(
    json.migrationVersion === null || typeof json.migrationVersion === "string",
    "Health response must include migrationVersion."
  );
  if (isCanonicalProduction) {
    if (typeof json.gitSha === "string" && json.gitSha.length >= 7) {
      // ok
    } else if (json.status === "degraded" && json.checks?.postgresDirect?.ok === true) {
      console.log("⚠ Production health missing gitSha during degraded REST/egress recovery");
    } else {
      assert(false, "Production health must include gitSha.");
    }
    assert(json.checks?.postgresDirect?.ok === true, `Direct Postgres check failed: ${json.checks?.postgresDirect?.error ?? "unknown"}`);
  }

  if (json.ok !== true) {
    const explicitlyAllowedRecovery =
      process.env.ALLOW_DEGRADED_HEALTH === "1" &&
      json.status === "degraded" &&
      json.checks?.postgresDirect?.ok === true;
    assert(
      explicitlyAllowedRecovery,
      "Health response must contain ok=true. Set ALLOW_DEGRADED_HEALTH=1 only for an explicit recovery run with healthy direct Postgres.",
    );
    console.log(
      `⚠ /api/health degraded explicitly allowed for recovery (deployEnv=${json.environment.deployEnv}, migrationVersion=${json.migrationVersion ?? "—"})`,
    );
    return;
  }

  const expectedGitSha = process.env.EXPECTED_GIT_SHA?.trim();
  if (expectedGitSha) {
    assert(
      typeof json.gitSha === "string" && json.gitSha.startsWith(expectedGitSha),
      `Production SHA ${json.gitSha ?? "missing"} does not match ${expectedGitSha}`,
    );
  }

  console.log(
    `✓ /api/health (deployEnv=${json.environment.deployEnv}, migrationVersion=${json.migrationVersion ?? "—"})`
  );
}

async function checkAsset(pathname, expectedType) {
  const asset = await get(pathname, "asset");
  assert(asset.status === 200, `GET ${pathname} returned ${asset.status}`);
  assert(asset.contentType.includes(expectedType), `GET ${pathname} expected ${expectedType}, got ${asset.contentType}`);
  console.log(`✓ ${pathname}`);
}

async function checkInternalRouteClosed(pathname) {
  const page = await get(pathname, "internal_route");
  assert(page.status === 404, `GET ${pathname} expected 404, got ${page.status}`);
  console.log(`✓ ${pathname} closed`);
}

async function checkAnonymousReadingHistory() {
  const response = await get("/api/blog/reading-history", "anonymous_reading_history");
  assert(response.status === 200, `GET /api/blog/reading-history returned ${response.status}`);
  const json = JSON.parse(response.text);
  assert(Array.isArray(json.entries), "Anonymous reading history must return entries array");
  console.log("✓ anonymous reading history");
}

async function checkPage(pathname) {
  const page = await get(pathname, "public_page");
  assert(page.status === 200, `GET ${pathname} returned ${page.status}: ${truncate(page.text)}`);
  assert(
    page.contentType.includes("text/html"),
    `GET ${pathname} expected text/html, got ${page.contentType || "unknown"}`
  );
  assert(page.text.toLowerCase().includes("<html"), `GET ${pathname} did not return HTML document.`);
  console.log(`✓ ${pathname}`);
  return page;
}

async function checkRedirect(pathname, expectedPathFragment) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: "GET",
    redirect: "manual",
    signal: AbortSignal.timeout(Number.isFinite(timeoutMs) ? timeoutMs : 15000),
  });

  assert(
    response.status >= 301 && response.status <= 308,
    `GET ${pathname} expected redirect, got ${response.status}`
  );
  const location = response.headers.get("location") ?? "";
  assert(
    location.includes(expectedPathFragment),
    `GET ${pathname} redirect location ${location} missing ${expectedPathFragment}`
  );
  console.log(`✓ ${pathname} → ${location.replace(baseUrl, "")}`);
}

async function checkBlogPostHasHeroImage(pathname) {
  const page = await get(pathname, "blog_hero");
  assert(page.status === 200, `GET ${pathname} returned ${page.status}`);

  const ogMatch = page.text.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
  );
  const ogImage = ogMatch?.[1] ?? "";
  assert(
    ogImage && !ogImage.includes("logo-light.svg"),
    `${pathname}: og:image must not be site logo (${ogImage || "missing"})`
  );

  const hasBlogMedia =
    /media\/blog\//i.test(page.text) ||
    /_next\/image[^"']+media(%2F|%252F)blog/i.test(page.text);
  assert(hasBlogMedia, `${pathname}: expected blog hero media in HTML`);

  console.log(`✓ ${pathname} hero image (og:image set)`);
}

async function checkCommercialCatalog(catalogPath, catalogHtml) {
  const detailPath = await verifyCommercialCatalogFromHtml({
    catalogPath,
    catalogHtml,
    fetchDetail: (pathname) => get(pathname, "commercial_detail"),
  });
  console.log(`✓ ${catalogPath} → ${detailPath}`);
}

async function main() {
  loadEnvLocal();
  console.log(`Production smoke base URL: ${baseUrl}`);

  await checkHealth();
  const checkedPages = new Map();
  for (const pathname of PAGE_PATHS) {
    checkedPages.set(pathname, await checkPage(pathname));
  }
  await checkCommercialCatalog("/tours", checkedPages.get("/tours")?.text ?? "");
  await checkCommercialCatalog("/excursions", checkedPages.get("/excursions")?.text ?? "");

  await checkRedirect("/map", "/mapa-argentina");
  await checkInternalRouteClosed("/dev/design-system");
  await checkAnonymousReadingHistory();
  await checkAsset("/favicon.ico", "image/");
  await checkAsset("/favicon-16x16.png", "image/png");
  await checkAsset("/favicon-32x32.png", "image/png");
  await checkAsset("/apple-touch-icon.png", "image/png");
  await checkAsset("/icons/icon-192.png", "image/png");
  await checkAsset("/icons/icon-512.png", "image/png");
  await checkAsset("/icons/icon-maskable-512.png", "image/png");
  await checkBlogPostHasHeroImage("/blog/buenos-aires-rajony");
  await checkBlogPostHasHeroImage("/blog/natsionalnyy-park-iguasu");

  console.log("Production smoke checks passed.");
}

main().catch((error) => {
  console.error("Production smoke checks failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
