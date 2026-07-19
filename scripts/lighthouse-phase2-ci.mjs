#!/usr/bin/env node
/**
 * Sprint 3 — blocking public-route Lighthouse budgets (mobile-first).
 *
 * Three cold runs per control route; performance, SEO, accessibility,
 * LCP, CLS, TBT and transfer budgets must all pass.
 *
 * Usage (local, after npm run build):
 *   node scripts/lighthouse-phase2-ci.mjs
 *
 * Usage (production CDN — no local server):
 *   LIGHTHOUSE_BASE_URL=https://www.goargentina.ru node scripts/lighthouse-phase2-ci.mjs
 *   npm run lighthouse:phase2:prod
 */
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const PORT = Number(process.env.LIGHTHOUSE_PORT ?? 3000);
const envBase = process.env.LIGHTHOUSE_BASE_URL?.replace(/\/$/, "");
const isExternalBase =
  Boolean(envBase) && !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(envBase);
const BASE_URL = envBase ?? `http://127.0.0.1:${PORT}`;
const START_TIMEOUT_MS = 90_000;

export const LIGHTHOUSE_PHASE2_PATHS = [
  "/",
  "/tours",
  "/blog",
  "/destinations/patagonia",
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url) {
  const started = Date.now();
  while (Date.now() - started < START_TIMEOUT_MS) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return true;
    } catch {
      // retry
    }
    await sleep(1500);
  }
  return false;
}

function runAudit() {
  return spawnSync("node", ["scripts/lighthouse-blog-cwv.mjs"], {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      LIGHTHOUSE_BASE_URL: BASE_URL,
      LIGHTHOUSE_SAMPLE_PATHS: LIGHTHOUSE_PHASE2_PATHS.join(","),
      LIGHTHOUSE_RUNS_PER_PATH: process.env.LIGHTHOUSE_RUNS_PER_PATH ?? "3",
      LIGHTHOUSE_CATEGORIES: "performance,accessibility,seo",
      LIGHTHOUSE_PERF_BUDGET: process.env.LIGHTHOUSE_PERF_BUDGET ?? (isExternalBase ? "65" : "75"),
      LIGHTHOUSE_REPORT_FILE: isExternalBase
        ? "lighthouse-phase2-prod-last.json"
        : "lighthouse-phase2-sample-last.json",
    },
  }).status ?? 1;
}

let auditStatus = 1;
let server = null;

if (process.env.SKIP_LIGHTHOUSE === "1") {
  console.log("SKIP_LIGHTHOUSE=1 — skipping Lighthouse phase2 audit.");
  process.exit(0);
}

try {
  if (isExternalBase) {
    console.log(`Lighthouse phase2 against ${BASE_URL} (external, no local server)`);
    const ready = await waitForServer(`${BASE_URL}/`);
    if (!ready) {
      console.error(`Target not reachable: ${BASE_URL}/`);
      process.exit(1);
    }
    auditStatus = runAudit();
  } else {
    server = spawn("npm", ["run", "start", "--", "-p", String(PORT)], {
      cwd: root,
      stdio: "ignore",
      env: { ...process.env, PORT: String(PORT) },
    });

    const ready = await waitForServer(`${BASE_URL}/`);
    if (!ready) {
      console.error(`Server did not become ready at ${BASE_URL}/ within ${START_TIMEOUT_MS}ms`);
      process.exit(1);
    }

    auditStatus = runAudit();
  }
} finally {
  server?.kill("SIGTERM");
}

process.exit(auditStatus);
