#!/usr/bin/env node
/**
 * Public smoke checks (API + root page, no browser).
 *
 * Optional env:
 * - SMOKE_BASE_URL=http://127.0.0.1:3000
 * - SMOKE_TIMEOUT_MS=15000
 *
 * Usage:
 *   node scripts/smoke-public.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const baseUrl = (process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const timeoutMs = Number.parseInt(process.env.SMOKE_TIMEOUT_MS ?? "15000", 10);

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

function truncate(text, max = 280) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

async function get(pathname, expectedContent = "text") {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: "GET",
    signal: AbortSignal.timeout(Number.isFinite(timeoutMs) ? timeoutMs : 15000),
  });

  const text = await response.text();
  if (expectedContent === "json") {
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      throw new Error(`Expected JSON from ${pathname}, got: ${truncate(text)}`);
    }
    return { status: response.status, text, json };
  }

  return { status: response.status, text };
}

async function main() {
  loadEnvLocal();
  console.log(`Public smoke base URL: ${baseUrl}`);

  const rootPage = await get("/");
  assert(rootPage.status === 200, `GET / returned ${rootPage.status}`);
  console.log("✓ GET /");

  const legal = await get("/api/site/legal", "json");
  assert(legal.status === 200, `GET /api/site/legal returned ${legal.status}: ${truncate(legal.text)}`);
  assert(legal.json && typeof legal.json === "object", "Legal response must be a JSON object.");
  console.log("✓ GET /api/site/legal");

  const health = await get("/api/health", "json");
  assert(health.status === 200 || health.status === 503, `GET /api/health returned ${health.status}`);
  assert(health.json && typeof health.json === "object", "Health response must be a JSON object.");
  assert(typeof health.json.ok === "boolean", "Health response must include boolean 'ok'.");
  assert(typeof health.json.version === "string", "Health response must include 'version'.");
  assert(
    health.json.checks?.migrations &&
      (typeof health.json.checks.migrations.latestId === "string" ||
        health.json.checks.migrations.latestId === null),
    "Health response must include checks.migrations.latestId."
  );
  console.log("✓ GET /api/health");

  const index = await get("/api/site/search-index", "json");
  assert(
    index.status === 200,
    `GET /api/site/search-index returned ${index.status}: ${truncate(index.text)}`
  );
  assert(Array.isArray(index.json), "Search index response must be an array.");
  console.log("✓ GET /api/site/search-index");

  const reviewEligibility = await get("/api/reviews/eligibility?tourSlug=patagonia", "json");
  assert(
    reviewEligibility.status === 401 || reviewEligibility.status === 503,
    `GET /api/reviews/eligibility must require auth or be disabled, got ${reviewEligibility.status}`
  );
  console.log("✓ GET /api/reviews/eligibility (auth gate)");

  console.log("Public smoke checks passed.");
}

main().catch((error) => {
  console.error("Public smoke checks failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
