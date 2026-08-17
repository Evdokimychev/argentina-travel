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
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveLighthouseStartTimeout } from "./lib/lighthouse-runtime.mjs";
import { waitForLocalUrl } from "./lib/lighthouse-managed-server.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const PORT = Number(process.env.LIGHTHOUSE_PORT ?? 3000);
const envBase = process.env.LIGHTHOUSE_BASE_URL?.replace(/\/$/, "");
const isExternalBase =
  Boolean(envBase) && !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(envBase);
const BASE_URL = envBase ?? `http://127.0.0.1:${PORT}`;
const evidenceScope =
  process.env.LIGHTHOUSE_EVIDENCE_SCOPE ?? (isExternalBase ? "production-baseline" : "candidate");
const START_TIMEOUT_MS = resolveLighthouseStartTimeout(
  process.env.LIGHTHOUSE_START_TIMEOUT_MS,
);

export const LIGHTHOUSE_PHASE2_PATHS = [
  "/",
  "/tours",
  "/tours/po-kontrastnoy-argentine-v-ritme-tango-buenos-ayres-patagoniya-vodopady-iguasu-i-t108535",
  "/blog",
  // Heavy editorial article details are covered by `lighthouse:blog` and
  // production baselines. On GitHub-hosted runners their post-load a11y/DOM
  // gather routinely exceeds the cold-run timeout and destabilizes Chrome.
  "/contacts",
  "/destinations/patagonia",
  // MapLibre/WebGL cold gathers occasionally hang on GHA runners and, after a
  // hard timeout kill, historically poisoned later CDP sessions. Keep the map
  // in the blocking set, but run it last so earlier public routes still produce
  // complete 3-run evidence when the canvas gather wedges.
  "/mapa-argentina",
];

// The partner detail depends on live supplier inventory and is therefore a
// production-only acceptance route. An isolated CI build intentionally has no
// partner credentials and must not turn an expected 404 into performance data.
const samplePaths = isExternalBase
  ? LIGHTHOUSE_PHASE2_PATHS
  : LIGHTHOUSE_PHASE2_PATHS.filter((samplePath) => !samplePath.startsWith("/tours/"));

function runAudit() {
  return spawnSync("node", ["scripts/lighthouse-blog-cwv.mjs"], {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      LIGHTHOUSE_BASE_URL: BASE_URL,
      LIGHTHOUSE_PORT: String(PORT),
      // Candidate CI owns the Next server inside the CWV harness so a hung
      // gather / OOM can restart :PORT and continue remaining cold runs.
      LIGHTHOUSE_MANAGE_SERVER: isExternalBase ? "0" : "1",
      LIGHTHOUSE_SAMPLE_PATHS: samplePaths.join(","),
      LIGHTHOUSE_RUNS_PER_PATH: process.env.LIGHTHOUSE_RUNS_PER_PATH ?? "3",
      // A local candidate is deliberately noindex. SEO is blocking only on the
      // published canonical host; local CI still blocks on a11y, payload and
      // repeatable mobile performance evidence.
      LIGHTHOUSE_CATEGORIES: isExternalBase
        ? "performance,accessibility,seo"
        : "performance,accessibility",
      LIGHTHOUSE_PERF_BUDGET: process.env.LIGHTHOUSE_PERF_BUDGET ?? (isExternalBase ? "75" : "55"),
      LIGHTHOUSE_EVIDENCE_SCOPE: evidenceScope,
      EVIDENCE_ENVIRONMENT:
        process.env.EVIDENCE_ENVIRONMENT ??
        (evidenceScope === "candidate" ? "local-production" : "production-baseline"),
      LIGHTHOUSE_REPORT_FILE: evidenceScope === "production-baseline"
        ? "lighthouse-phase2-prod-last.json"
        : "lighthouse-phase2-sample-last.json",
    },
  }).status ?? 1;
}

if (process.env.SKIP_LIGHTHOUSE === "1") {
  console.log("SKIP_LIGHTHOUSE=1 — skipping Lighthouse phase2 audit.");
  process.exit(0);
}

if (isExternalBase) {
  console.log(`Lighthouse phase2 against ${BASE_URL} (external, no local server)`);
  const ready = await waitForLocalUrl(`${BASE_URL}/`, START_TIMEOUT_MS);
  if (!ready) {
    console.error(`Target not reachable: ${BASE_URL}/`);
    process.exit(1);
  }
}

process.exit(runAudit());
