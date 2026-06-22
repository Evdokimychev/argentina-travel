#!/usr/bin/env node
/**
 * Lighthouse Core Web Vitals audit for blog sample URLs (S13).
 *
 * Requires a running site (build + start or dev).
 *
 * Usage:
 *   npm run build && npm run start &
 *   LIGHTHOUSE_BASE_URL=http://127.0.0.1:3000 node scripts/lighthouse-blog-cwv.mjs
 *
 * Env:
 *   LIGHTHOUSE_BASE_URL — default http://127.0.0.1:3000
 *   LIGHTHOUSE_SAMPLE_PATHS — comma-separated paths
 *   LIGHTHOUSE_CATEGORIES — comma-separated (default: performance)
 *   LIGHTHOUSE_REPORT_FILE — relative to var/ops (default: lighthouse-blog-cwv-last.json)
 *   SKIP_LIGHTHOUSE=1 — exit 0 without running (CI without server)
 *
 * Writes: var/ops/lighthouse-blog-cwv-last.json
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const reportDir = path.join(root, "var/ops");
const reportFile = path.join(
  reportDir,
  process.env.LIGHTHOUSE_REPORT_FILE ?? "lighthouse-blog-cwv-last.json",
);

const BASE_URL = (process.env.LIGHTHOUSE_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");

const SAMPLE_PATHS = (process.env.LIGHTHOUSE_SAMPLE_PATHS?.split(",").map((p) => p.trim()).filter(Boolean) ??
  [
    "/blog",
    "/blog/hub/patagonia",
    "/blog/patagonia-packing-list",
    "/blog/argentinian-steak-guide",
    "/blog/natsionalnyy-park-iguasu",
  ]);

const CATEGORIES = (
  process.env.LIGHTHOUSE_CATEGORIES?.split(",").map((c) => c.trim()).filter(Boolean) ?? ["performance"]
);

const BUDGET = {
  performance: Number(process.env.LIGHTHOUSE_PERF_BUDGET ?? 90),
  accessibility: Number(process.env.LIGHTHOUSE_A11Y_BUDGET ?? 95),
  lcpMs: 2500,
  cls: 0.1,
  inpMs: 200,
};

if (process.env.SKIP_LIGHTHOUSE === "1") {
  console.log("SKIP_LIGHTHOUSE=1 — skipping Lighthouse blog CWV audit.");
  process.exit(0);
}

function probe(url) {
  try {
    const res = spawnSync(
      process.execPath,
      [
        "-e",
        `fetch(${JSON.stringify(url)}, { signal: AbortSignal.timeout(8000) }).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))`,
      ],
      { stdio: "ignore", env: { ...process.env } },
    );
    return res.status === 0;
  } catch {
    return false;
  }
}

if (!probe(`${BASE_URL}${SAMPLE_PATHS[0] ?? "/blog"}`)) {
  console.error(
    `Cannot reach ${BASE_URL}${SAMPLE_PATHS[0] ?? "/blog"} — start the server first (npm run build && npm run start).`,
  );
  console.error("Set SKIP_LIGHTHOUSE=1 to skip in CI without a running server.");
  process.exit(1);
}

/** @type {Array<Record<string, unknown>>} */
const results = [];
let failed = false;

for (const samplePath of SAMPLE_PATHS) {
  const url = `${BASE_URL}${samplePath}`;
  const outFile = path.join(reportDir, `lh-${samplePath.replace(/\//g, "_")}.json`);

  console.log(`\nLighthouse (mobile): ${url}`);

  const lh = spawnSync(
    "npx",
    [
      "--yes",
      "lighthouse",
      url,
      "--quiet",
      "--chrome-flags=--headless --no-sandbox --disable-gpu",
      "--only-categories=" + CATEGORIES.join(","),
      "--form-factor=mobile",
      "--screenEmulation.mobile=true",
      "--throttling-method=simulate",
      "--output=json",
      `--output-path=${outFile}`,
    ],
    { stdio: "inherit", cwd: root, env: process.env },
  );

  if (lh.status !== 0 || !fs.existsSync(outFile)) {
    failed = true;
    results.push({ path: samplePath, url, error: "lighthouse failed" });
    continue;
  }

  const report = JSON.parse(fs.readFileSync(outFile, "utf8"));
  const perfScore = Math.round((report.categories?.performance?.score ?? 0) * 100);
  const a11yScore =
    CATEGORIES.includes("accessibility")
      ? Math.round((report.categories?.accessibility?.score ?? 0) * 100)
      : null;
  const audits = report.audits ?? {};

  const lcpMs = audits["largest-contentful-paint"]?.numericValue ?? Infinity;
  const cls = audits["cumulative-layout-shift"]?.numericValue ?? Infinity;
  const inpMs =
    audits["interaction-to-next-paint"]?.numericValue ??
    audits["experimental-interaction-to-next-paint"]?.numericValue ??
    null;

  const perfPass =
    !CATEGORIES.includes("performance") ||
    (perfScore >= BUDGET.performance &&
      lcpMs <= BUDGET.lcpMs &&
      cls <= BUDGET.cls &&
      (inpMs == null || inpMs <= BUDGET.inpMs));
  const a11yPass =
    a11yScore == null || a11yScore >= BUDGET.accessibility;

  const row = {
    path: samplePath,
    url,
    performance: CATEGORIES.includes("performance") ? perfScore : null,
    accessibility: a11yScore,
    lcpMs: Math.round(lcpMs),
    cls: Number(cls.toFixed(3)),
    inpMs: inpMs != null ? Math.round(inpMs) : null,
    pass: perfPass && a11yPass,
  };

  results.push(row);

  const status = row.pass ? "PASS" : "FAIL";
  console.log(
    `  ${status}` +
      (row.performance != null ? ` perf=${row.performance}` : "") +
      (row.accessibility != null ? ` a11y=${row.accessibility}` : "") +
      ` LCP=${row.lcpMs}ms CLS=${row.cls}` +
      (row.inpMs != null ? ` INP=${row.inpMs}ms` : ""),
  );

  if (!row.pass) failed = true;
}

const perfScores = results
  .filter((r) => typeof r.performance === "number")
  .map((r) => r.performance);
const a11yScores = results
  .filter((r) => typeof r.accessibility === "number")
  .map((r) => r.accessibility);

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

const medianPerf = median(perfScores);
const medianA11y = median(a11yScores);

const summary = {
  at: new Date().toISOString(),
  baseUrl: BASE_URL,
  categories: CATEGORIES,
  budget: BUDGET,
  medianPerformance: medianPerf,
  medianAccessibility: medianA11y || null,
  results,
  pass:
    !failed &&
    (perfScores.length === 0 || medianPerf >= BUDGET.performance) &&
    (a11yScores.length === 0 || medianA11y >= BUDGET.accessibility),
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(reportFile, JSON.stringify(summary, null, 2));
console.log(`\nReport: ${path.relative(root, reportFile)}`);
if (perfScores.length) {
  console.log(`Median Performance: ${medianPerf} (budget ≥ ${BUDGET.performance})`);
}
if (a11yScores.length) {
  console.log(`Median Accessibility: ${medianA11y} (budget ≥ ${BUDGET.accessibility})`);
}

process.exit(failed ? 1 : 0);
