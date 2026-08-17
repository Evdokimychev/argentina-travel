#!/usr/bin/env node
/**
 * Fail-closed gate separating:
 *   TECHNICAL PROMOTION READINESS  — contracts, release, health
 *   COMMERCIAL PROOF READINESS     — live funnel / lead / partner evidence
 *   PAID TRAFFIC DECISION          — requires both + live commercial proof
 *
 * Local vitest commercial-funnel contracts never alone produce PAID TRAFFIC GO.
 *
 *   npm run promotion:gate
 *   SMOKE_BASE_URL=https://www.goargentina.ru npm run promotion:gate
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import nextEnv from "@next/env";

const root = process.cwd();
nextEnv.loadEnvConfig(root, false);

const baseUrl = (process.env.SMOKE_BASE_URL || "https://www.goargentina.ru").replace(/\/$/, "");
const reportPath = path.join(root, "var/ops/promotion-gate-last.json");
const LIVE_CLAIM_KEYS = [
  "events",
  "dashboard",
  "conversionProof",
  "leadCapture",
  "deduplication",
  "revenueAttribution",
];

function run(label, command, args, { required = true } = {}) {
  console.log(`\n==> ${label}`);
  const result = spawnSync(command, args, {
    cwd: root,
    env: { ...process.env, SMOKE_BASE_URL: baseUrl, ANALYTICS_BASE_URL: baseUrl },
    encoding: "utf8",
    stdio: "inherit",
  });
  return { label, ok: result.status === 0, required };
}

function readJson(relativePath) {
  const absolute = path.join(root, relativePath);
  if (!fs.existsSync(absolute)) return null;
  try {
    return JSON.parse(fs.readFileSync(absolute, "utf8"));
  } catch {
    return null;
  }
}

async function probe(pathname) {
  try {
    const response = await fetch(`${baseUrl}${pathname}`, {
      signal: AbortSignal.timeout(15_000),
    });
    const body = await response.json().catch(() => ({}));
    return {
      pathname,
      httpStatus: response.status,
      status: body.status ?? null,
      ok: response.status < 500 && body.status !== "down",
      gitSha: body.gitSha ?? null,
    };
  } catch (error) {
    return {
      pathname,
      httpStatus: null,
      status: "down",
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function assessCommercialProof(commercialFunnel, analytics, partnerAttribution) {
  const gaps = [];
  const evidenceLevel = commercialFunnel?.evidenceLevel ?? null;

  if (!commercialFunnel || commercialFunnel.status !== "passed") {
    gaps.push("commercial-funnel local contracts missing or failed");
  }
  if (evidenceLevel === "local-contract") {
    gaps.push(
      "commercial-funnel evidenceLevel=local-contract cannot prove live conversion (EVENT≠CONVERSION)",
    );
  }
  for (const key of LIVE_CLAIM_KEYS) {
    if (commercialFunnel?.[key] === true && evidenceLevel === "local-contract") {
      gaps.push(`hand-edited or invalid live claim "${key}" under local-contract`);
    }
  }

  const liveAnalyticsOk =
    Array.isArray(analytics?.checks) &&
    ["live:gtm", "live:gtm-consent-default", "live:datalayer-init"].every((id) =>
      analytics.checks.some((check) => check.id === id && check.status === "ok"),
    );
  if (!liveAnalyticsOk) {
    gaps.push("live GTM/consent/dataLayer evidence incomplete");
  }

  const partnerProof =
    partnerAttribution?.testClick === true &&
    partnerAttribution?.partnerDashboardProof === true &&
    partnerAttribution?.reconciliation === true;
  if (!partnerProof) {
    gaps.push("partner attribution proof incomplete (testClick/dashboard/reconciliation)");
  }

  const liveClaimsSatisfied =
    commercialFunnel?.events === true &&
    commercialFunnel?.dashboard === true &&
    commercialFunnel?.conversionProof === true &&
    commercialFunnel?.leadCapture === true &&
    evidenceLevel &&
    evidenceLevel !== "local-contract";

  if (!liveClaimsSatisfied) {
    gaps.push("live commercial claims (events/dashboard/conversionProof/leadCapture) not proven");
  }

  return {
    ok: gaps.length === 0,
    gaps,
    evidenceLevel,
    liveClaimsSatisfied: Boolean(liveClaimsSatisfied),
    liveAnalyticsOk,
    partnerProof: Boolean(partnerProof),
  };
}

async function main() {
  const steps = [];
  steps.push(
    run("release:public-production", "npm", ["run", "release:public-production"], {
      required: true,
    }),
  );
  steps.push(
    run("commercial-funnel-readiness", "node", ["scripts/commercial-funnel-readiness.mjs"], {
      required: true,
    }),
  );
  steps.push(
    run("analytics-readiness", "npm", ["run", "analytics-readiness"], { required: true }),
  );
  steps.push(run("gtm-events:audit", "npm", ["run", "gtm-events:audit"], { required: true }));

  const health = await Promise.all([
    probe("/api/health/public"),
    probe("/api/health/database"),
    probe("/api/health/partners"),
  ]);

  const hardDown = health.filter((row) => row.status === "down" || !row.ok);
  const technicalStepsOk = steps.every((step) => !step.required || step.ok);
  const technicalReadiness =
    technicalStepsOk && hardDown.length === 0 ? "GO" : "NO-GO";

  const commercialFunnel = readJson("var/ops/commercial-funnel-last.json");
  const analytics = readJson("var/ops/analytics-readiness-last.json");
  const partnerAttribution = readJson("var/ops/partner-attribution-last.json");
  const commercialProof = assessCommercialProof(
    commercialFunnel,
    analytics,
    partnerAttribution,
  );
  const commercialProofReadiness = commercialProof.ok ? "GO" : "NO-GO";

  const paidTrafficDecision =
    technicalReadiness === "GO" && commercialProofReadiness === "GO" ? "GO" : "NO-GO";

  // Backward-compatible top-level decision = paid traffic (strict).
  const decision = paidTrafficDecision;

  const report = {
    schemaVersion: 2,
    baseUrl,
    generatedAt: new Date().toISOString(),
    gitSha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_SHA || null,
    steps,
    health,
    hardDownCount: hardDown.length,
    technicalReadiness,
    commercialProofReadiness,
    paidTrafficDecision,
    commercialProof,
    decision,
    semantics: {
      technicalReadiness:
        "Local contracts + public release checks + non-down health endpoints",
      commercialProofReadiness:
        "Live analytics + non-local commercial claims + partner reconciliation evidence",
      paidTrafficDecision:
        "Requires both technical readiness and commercial proof; local-contract alone is never enough",
    },
  };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\nWrote ${reportPath}`);
  console.log(`technicalReadiness: ${technicalReadiness}`);
  console.log(`commercialProofReadiness: ${commercialProofReadiness}`);
  console.log(`paidTrafficDecision: ${paidTrafficDecision}`);
  if (commercialProof.gaps.length) {
    console.log("commercial proof gaps:");
    for (const gap of commercialProof.gaps) console.log(`  - ${gap}`);
  }

  if (decision !== "GO") {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
