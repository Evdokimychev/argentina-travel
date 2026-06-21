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
const reportFile = path.join(reportDir, "lighthouse-blog-cwv-last.json");

const BASE_URL = (process.env.LIGHTHOUSE_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");

const SAMPLE_PATHS = [
  "/blog",
  "/blog/hub/patagonia",
  "/blog/patagonia-packing-list",
  "/blog/argentinian-steak-guide",
  "/blog/natsionalnyy-park-iguasu",
];

const BUDGET = {
  performance: 90,
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

if (!probe(`${BASE_URL}/blog`)) {
  console.error(
    `Cannot reach ${BASE_URL}/blog — start the server first (npm run build && npm run start).`,
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
      "--only-categories=performance",
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
  const audits = report.audits ?? {};

  const lcpMs = audits["largest-contentful-paint"]?.numericValue ?? Infinity;
  const cls = audits["cumulative-layout-shift"]?.numericValue ?? Infinity;
  const inpMs =
    audits["interaction-to-next-paint"]?.numericValue ??
    audits["experimental-interaction-to-next-paint"]?.numericValue ??
    null;

  const row = {
    path: samplePath,
    url,
    performance: perfScore,
    lcpMs: Math.round(lcpMs),
    cls: Number(cls.toFixed(3)),
    inpMs: inpMs != null ? Math.round(inpMs) : null,
    pass:
      perfScore >= BUDGET.performance &&
      lcpMs <= BUDGET.lcpMs &&
      cls <= BUDGET.cls &&
      (inpMs == null || inpMs <= BUDGET.inpMs),
  };

  results.push(row);

  const status = row.pass ? "PASS" : "FAIL";
  console.log(
    `  ${status} perf=${perfScore} LCP=${row.lcpMs}ms CLS=${row.cls}` +
      (row.inpMs != null ? ` INP=${row.inpMs}ms` : ""),
  );

  if (!row.pass) failed = true;
}

const perfScores = results.filter((r) => typeof r.performance === "number").map((r) => r.performance);
const medianPerf =
  perfScores.length > 0
    ? perfScores.sort((a, b) => a - b)[Math.floor(perfScores.length / 2)]
    : 0;

const summary = {
  at: new Date().toISOString(),
  baseUrl: BASE_URL,
  budget: BUDGET,
  medianPerformance: medianPerf,
  results,
  pass: !failed && medianPerf >= BUDGET.performance,
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(reportFile, JSON.stringify(summary, null, 2));
console.log(`\nReport: ${path.relative(root, reportFile)}`);
console.log(`Median Performance: ${medianPerf} (budget ≥ ${BUDGET.performance})`);

process.exit(failed ? 1 : 0);
