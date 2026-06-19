#!/usr/bin/env node
/**
 * Admin smoke checks (API only, no browser).
 *
 * Required env:
 * - SMOKE_ADMIN_COOKIE=<full Cookie header from logged-in admin session>
 *   OR
 * - SMOKE_ADMIN_BEARER=<admin bearer token> (e.g. service role key)
 *   OR
 * - SUPABASE_SERVICE_ROLE_KEY=<service role key used as Bearer token>
 *
 * Optional env:
 * - SMOKE_BASE_URL=http://127.0.0.1:3000
 * - SMOKE_TIMEOUT_MS=15000
 *
 * Usage:
 *   node scripts/smoke-admin.mjs
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
  if (!condition) {
    throw new Error(message);
  }
}

function truncate(text, max = 280) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function buildAuthHeaders() {
  const headers = { Accept: "application/json" };
  const cookie = process.env.SMOKE_ADMIN_COOKIE?.trim();
  const bearer =
    process.env.SMOKE_ADMIN_BEARER?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

  if (!cookie && !bearer) {
    throw new Error(
      "Missing admin auth env. Set SMOKE_ADMIN_COOKIE or SMOKE_ADMIN_BEARER or SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  if (cookie) {
    headers.Cookie = cookie;
  }
  if (bearer) {
    headers.Authorization = `Bearer ${bearer}`;
  }

  return headers;
}

async function requestJson(pathname, headers) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(Number.isFinite(timeoutMs) ? timeoutMs : 15000),
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return { status: response.status, ok: response.ok, json, text };
}

function expectHealthPayload(payload) {
  assert(payload && typeof payload === "object", "Health response must be a JSON object.");
  assert(typeof payload.ok === "boolean", "Health response must include boolean 'ok'.");
  assert(payload.checks && typeof payload.checks === "object", "Health response must include 'checks'.");
  assert(typeof payload.generatedAt === "string", "Health response must include 'generatedAt' timestamp.");
}

async function main() {
  loadEnvLocal();
  const headers = buildAuthHeaders();

  console.log(`Admin smoke base URL: ${baseUrl}`);

  const health = await requestJson("/api/admin/health", headers);
  assert(health.status === 200 || health.status === 503, `GET /api/admin/health returned ${health.status}.`);
  expectHealthPayload(health.json);
  console.log("✓ GET /api/admin/health");

  const dashboard = await requestJson("/api/admin/dashboard?period=7d", headers);
  assert(
    dashboard.status === 200,
    `GET /api/admin/dashboard?period=7d returned ${dashboard.status}: ${truncate(dashboard.text)}`
  );
  assert(
    dashboard.json && typeof dashboard.json === "object" && "widgets" in dashboard.json,
    "Dashboard response must include 'widgets'."
  );
  console.log("✓ GET /api/admin/dashboard?period=7d");

  const payments = await requestJson("/api/admin/payments", headers);
  assert(
    payments.status === 200,
    `GET /api/admin/payments returned ${payments.status}: ${truncate(payments.text)}`
  );
  assert(
    payments.json && typeof payments.json === "object" && Array.isArray(payments.json.payments),
    "Payments response must include array 'payments'."
  );
  assert(
    payments.json && typeof payments.json.stats === "object" && payments.json.stats !== null,
    "Payments response must include object 'stats'."
  );
  console.log("✓ GET /api/admin/payments");

  console.log("Admin smoke checks passed.");
}

main().catch((error) => {
  console.error("Admin smoke checks failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
