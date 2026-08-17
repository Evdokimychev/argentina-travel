#!/usr/bin/env node
/**
 * Sprint 2 — marketplace quality audit (deterministic, no live partner hammering).
 *
 * Usage:
 *   npm run marketplace:quality
 *   SMOKE_BASE_URL=https://www.goargentina.ru npm run marketplace:quality:prod
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outPath = path.join(root, "var/ops/marketplace-quality-last.json");

function run(command, args, env = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

const unit = run("npx", [
  "vitest",
  "run",
  "src/lib/partner-tours/offer-quality.test.ts",
  "src/lib/partner-tours/duplicate-detection.test.ts",
  "src/lib/youtravel/partner-invariants.test.ts",
  "src/lib/youtravel/offers-mapper.test.ts",
  "src/lib/partner-tours/filter-price.test.ts",
]);

const regression = run("npm", ["run", "test:partner-regression"]);

const crawlEnv = process.env.SMOKE_BASE_URL
  ? { SMOKE_BASE_URL: process.env.SMOKE_BASE_URL }
  : {};
const crawl = run("node", ["scripts/public-card-detail-crawl.mjs"], crawlEnv);

let partnersHealth = null;
const baseUrl = (process.env.SMOKE_BASE_URL ?? "").replace(/\/$/, "");
if (baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/api/health/partners`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    partnersHealth = {
      httpStatus: response.status,
      body: await response.json().catch(() => null),
    };
  } catch (error) {
    partnersHealth = {
      httpStatus: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

let crawlReport = null;
const crawlReportPath = path.join(root, "var/ops/public-card-detail-crawl.json");
if (fs.existsSync(crawlReportPath)) {
  try {
    crawlReport = JSON.parse(fs.readFileSync(crawlReportPath, "utf8"));
  } catch {
    crawlReport = null;
  }
}

const report = {
  at: new Date().toISOString(),
  baseUrl: process.env.SMOKE_BASE_URL ?? null,
  gates: {
    offerQualityUnit: unit.status === 0,
    partnerRegression: regression.status === 0,
    publicCardDetailCrawl: crawl.status === 0,
  },
  partnersHealth,
  crawl: crawlReport
    ? {
        cardCount: crawlReport.cardCount,
        false404Count: crawlReport.false404Count,
        unavailableCount: crawlReport.unavailableCount,
        okCount: crawlReport.okCount,
      }
    : null,
  notes: [
    "Offer quality gate filters past-only / invalid-price / irrelevant partner cards from the commercial catalog.",
    "Partner regression covers YouTravel price/occupancy/booking fallback invariants.",
    "Live partner imported/public/rejected counts require healthy Supabase (/api/health/partners).",
  ],
  pass:
    unit.status === 0 &&
    regression.status === 0 &&
    crawl.status === 0 &&
    (crawlReport?.false404Count ?? 0) === 0,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`marketplace:quality pass=${report.pass}`);
console.log(
  `  unit=${report.gates.offerQualityUnit} regression=${report.gates.partnerRegression} crawl=${report.gates.publicCardDetailCrawl}`,
);
if (report.crawl) {
  console.log(
    `  crawl cards=${report.crawl.cardCount} false404=${report.crawl.false404Count} unavailable=${report.crawl.unavailableCount}`,
  );
}
if (partnersHealth?.body?.partners) {
  for (const [name, probe] of Object.entries(partnersHealth.body.partners)) {
    console.log(
      `  ${name}: status=${probe.status} count=${probe.count} freshness=${probe.freshness} lastSync=${probe.lastSyncAt}`,
    );
  }
}
console.log(`Report: ${path.relative(root, outPath)}`);

if (unit.status !== 0) {
  console.error(unit.stdout || unit.stderr);
}
if (regression.status !== 0) {
  console.error(regression.stderr || regression.stdout);
}
if (crawl.status !== 0) {
  console.error(crawl.stderr || crawl.stdout);
}

process.exit(report.pass ? 0 : 1);
