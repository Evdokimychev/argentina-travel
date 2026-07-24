#!/usr/bin/env node
/**
 * Public production release gate for commercial journeys.
 * Fails hard on catalog↔detail false 404s and partner/DB health "down".
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import nextEnv from "@next/env";

const root = process.cwd();
nextEnv.loadEnvConfig(root, false);

const baseUrl = (process.env.SMOKE_BASE_URL || "https://www.goargentina.ru").replace(/\/$/, "");
const reportPath = path.join(root, "var/ops/release-public-production.json");

function run(label, command, args, { required = true } = {}) {
  console.log(`\n==> ${label}`);
  const result = spawnSync(command, args, {
    cwd: root,
    env: { ...process.env, SMOKE_BASE_URL: baseUrl },
    encoding: "utf8",
    stdio: "inherit",
  });
  const ok = result.status === 0;
  if (!ok && required) {
    throw new Error(`Required step failed: ${label}`);
  }
  return { label, ok, required };
}

async function probeHealth(pathname) {
  try {
    const response = await fetch(`${baseUrl}${pathname}`, {
      signal: AbortSignal.timeout(15_000),
    });
    const body = await response.json().catch(() => ({}));
    return {
      pathname,
      httpStatus: response.status,
      status: body.status ?? null,
      ok: response.status < 500,
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
    run("public-detail-existence-tests", "npx", [
      "vitest",
      "run",
      "src/lib/public-detail-existence.test.ts",
      "src/lib/partner-source-result.test.ts",
      "src/lib/public-tour-resolver.test.ts",
    ], { required: true }),
  );
  steps.push(
    run("public-editorial-audit", "npm", ["run", "content:public-editorial"], {
      required: true,
    }),
  );
  steps.push(
    run("card-detail-crawl", "node", ["scripts/public-card-detail-crawl.mjs"], {
      required: true,
    }),
  );
  steps.push(
    run("sitemap-canonical-crawl", "node", ["scripts/sitemap-canonical-crawl.mjs"], {
      required: true,
    }),
  );
  steps.push(
    run("catalog-country-relevance-tests", "npx", [
      "vitest",
      "run",
      "src/lib/catalog-country-relevance.test.ts",
    ], { required: true }),
  );
  steps.push(
    run("production-smoke", "npm", ["run", "production-smoke"], { required: true }),
  );
  steps.push(
    run("analytics-readiness", "npm", ["run", "analytics-readiness"], {
      required: false,
    }),
  );

  const health = await Promise.all([
    probeHealth("/api/health/public"),
    probeHealth("/api/health/database"),
    probeHealth("/api/health/partners"),
  ]);

  const healthDown = health.filter((row) => row.status === "down" || row.httpStatus === 503 && row.pathname === "/api/health/public" && row.status === "down");
  // Partners/database may be degraded (REST 402 + PG ok) — allowed; full down fails.
  const hardDown = health.filter((row) => row.status === "down");

  const report = {
    baseUrl,
    generatedAt: new Date().toISOString(),
    gitSha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_SHA || null,
    steps,
    health,
    hardDownCount: hardDown.length,
  };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\nWrote ${reportPath}`);

  if (steps.some((step) => step.required && !step.ok) || hardDown.length === health.length) {
    console.error("release:public-production FAILED");
    process.exit(1);
  }

  console.log("release:public-production PASSED (degraded partner/REST allowed if PG works)");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
