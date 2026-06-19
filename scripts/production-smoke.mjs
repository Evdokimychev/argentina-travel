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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const baseUrl = (process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const timeoutMs = Number.parseInt(process.env.SMOKE_TIMEOUT_MS ?? "15000", 10);

const PAGE_PATHS = ["/", "/tours", "/excursions", "/destinations", "/places", "/blog"];

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

async function get(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: "GET",
    signal: AbortSignal.timeout(Number.isFinite(timeoutMs) ? timeoutMs : 15000),
  });

  const text = await response.text();
  return {
    status: response.status,
    text,
    contentType: response.headers.get("content-type") ?? "",
  };
}

async function checkHealth() {
  const health = await get("/api/health");
  assert(health.status === 200, `GET /api/health returned ${health.status}: ${truncate(health.text)}`);

  let json = null;
  try {
    json = health.text ? JSON.parse(health.text) : null;
  } catch {
    throw new Error(`GET /api/health did not return JSON: ${truncate(health.text)}`);
  }

  assert(json && typeof json === "object", "Health response must be an object.");
  assert(json.ok === true, "Health response must contain ok=true.");
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

  console.log(
    `✓ /api/health (deployEnv=${json.environment.deployEnv}, migrationVersion=${json.migrationVersion ?? "—"})`
  );
}

async function checkPage(pathname) {
  const page = await get(pathname);
  assert(page.status === 200, `GET ${pathname} returned ${page.status}: ${truncate(page.text)}`);
  assert(
    page.contentType.includes("text/html"),
    `GET ${pathname} expected text/html, got ${page.contentType || "unknown"}`
  );
  assert(page.text.toLowerCase().includes("<html"), `GET ${pathname} did not return HTML document.`);
  console.log(`✓ ${pathname}`);
}

async function main() {
  loadEnvLocal();
  console.log(`Production smoke base URL: ${baseUrl}`);

  await checkHealth();
  for (const pathname of PAGE_PATHS) {
    await checkPage(pathname);
  }

  console.log("Production smoke checks passed.");
}

main().catch((error) => {
  console.error("Production smoke checks failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
