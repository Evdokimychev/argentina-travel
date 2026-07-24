#!/usr/bin/env node
/**
 * Fail-closed gate for paid-traffic / promotion claims.
 * Composes existing producers; does not invent live GTM proof without env.
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
  const report = {
    baseUrl,
    generatedAt: new Date().toISOString(),
    gitSha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_SHA || null,
    steps,
    health,
    hardDownCount: hardDown.length,
    decision:
      steps.every((step) => step.ok) && hardDown.length === 0 ? "GO" : "NO-GO",
  };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\nWrote ${reportPath}`);
  console.log(`promotion:gate ${report.decision}`);

  if (report.decision !== "GO") {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
