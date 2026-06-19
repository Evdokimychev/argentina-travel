#!/usr/bin/env node
/**
 * E100: lightweight load scaffold for GET /api/v1/tours.
 *
 * Required env:
 * - LOAD_PUBLIC_API_KEY (or PUBLIC_API_KEY)
 *
 * Optional env:
 * - LOAD_BASE_URL=http://127.0.0.1:3000
 * - LOAD_DURATION_SEC=30
 * - LOAD_RPS=5
 * - LOAD_PAGE_SIZE=24
 * - LOAD_TIMEOUT_MS=15000
 * - LOAD_FAIL_ON_ERROR=false
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

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

function parseInteger(value, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function parseBoolean(value, fallback = false) {
  if (value == null) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
  return fallback;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

async function main() {
  loadEnvLocal();

  const baseUrl = (process.env.LOAD_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
  const apiKey = process.env.LOAD_PUBLIC_API_KEY ?? process.env.PUBLIC_API_KEY ?? "";
  const durationSec = parseInteger(process.env.LOAD_DURATION_SEC, 30, { min: 1, max: 3600 });
  const rps = parseInteger(process.env.LOAD_RPS, 5, { min: 1, max: 500 });
  const pageSize = parseInteger(process.env.LOAD_PAGE_SIZE, 24, { min: 1, max: 100 });
  const timeoutMs = parseInteger(process.env.LOAD_TIMEOUT_MS, 15000, { min: 1000, max: 120000 });
  const failOnError = parseBoolean(process.env.LOAD_FAIL_ON_ERROR, false);

  if (!apiKey.trim()) {
    console.error(
      "Missing API key. Set LOAD_PUBLIC_API_KEY (or PUBLIC_API_KEY) with tours:read scope."
    );
    process.exit(1);
  }

  const endpoint = `${baseUrl}/api/v1/tours?page=1&pageSize=${pageSize}`;
  const stopAt = Date.now() + durationSec * 1000;

  let total = 0;
  let ok = 0;
  let failed = 0;
  const durations = [];
  const statusCounts = new Map();

  console.log("Starting public API load scaffold");
  console.log(`Target: ${endpoint}`);
  console.log(`Duration: ${durationSec}s, target RPS: ${rps}, timeout: ${timeoutMs}ms`);

  while (Date.now() < stopAt) {
    const tickStart = Date.now();
    const batch = await Promise.all(
      Array.from({ length: rps }, async () => {
        const started = performance.now();
        try {
          const response = await fetch(endpoint, {
            method: "GET",
            signal: AbortSignal.timeout(timeoutMs),
            headers: {
              Accept: "application/json",
              "X-API-Key": apiKey,
              "User-Agent": "argentina-travel-e100-load-scaffold",
            },
          });
          const durationMs = performance.now() - started;
          return { status: response.status, durationMs };
        } catch {
          const durationMs = performance.now() - started;
          return { status: "network_error", durationMs };
        }
      })
    );

    for (const result of batch) {
      total += 1;
      durations.push(result.durationMs);

      const statusKey = String(result.status);
      statusCounts.set(statusKey, (statusCounts.get(statusKey) ?? 0) + 1);

      if (typeof result.status === "number" && result.status >= 200 && result.status < 300) {
        ok += 1;
      } else {
        failed += 1;
      }
    }

    const tickElapsed = Date.now() - tickStart;
    if (tickElapsed < 1000) {
      await sleep(1000 - tickElapsed);
    }
  }

  const elapsedSec = Math.max(1, durationSec);
  const actualRps = total / elapsedSec;
  const p50 = percentile(durations, 50);
  const p95 = percentile(durations, 95);
  const p99 = percentile(durations, 99);

  console.log("");
  console.log("Load scaffold summary");
  console.log(`Requests: ${total}, success: ${ok}, failed: ${failed}`);
  console.log(`Observed RPS: ${actualRps.toFixed(2)}`);
  console.log(`Latency ms: p50=${p50.toFixed(1)}, p95=${p95.toFixed(1)}, p99=${p99.toFixed(1)}`);
  console.log(
    `Statuses: ${Array.from(statusCounts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([status, count]) => `${status}=${count}`)
      .join(", ")}`
  );

  if (failed > 0) {
    const message = `Detected ${failed} non-2xx responses.`;
    if (failOnError) {
      console.error(message);
      process.exit(1);
    } else {
      console.warn(message);
    }
  }
}

main().catch((error) => {
  console.error("Load scaffold failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
