#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import nextEnv from "@next/env";

const root = process.cwd();
nextEnv.loadEnvConfig(root, false);
const reportPath = path.join(root, "var/ops/release-gate-report.json");
const logsDir = path.join(root, "var/ops/release-gate-logs");
const requestedGroup = process.argv.includes("--group")
  ? process.argv[process.argv.indexOf("--group") + 1]
  : null;

const groups = {
  static: [
    ["environment", "node", ["scripts/validate-build-mode.mjs"], true],
    ["secrets", "node", ["scripts/audit-secrets.mjs"], true],
    ["typescript", "npx", ["tsc", "--noEmit"], true],
    ["lint", "npm", ["run", "lint"], true],
  ],
  contracts: [
    ["unit-integration-contracts", "npm", ["test"], true],
    ["manual-content-sync", "npm", ["run", "sync-manual-posts:check"], true],
    ["rich-content-sync", "npm", ["run", "sync-rich-articles:check"], true],
    ["redirect-contracts", "npm", ["run", "sync-content-plan-redirects:check"], true],
  ],
  content: [
    ["content-lint", "npm", ["run", "content:audit"], true],
    ["content-governance", "npm", ["run", "content:governance"], true],
    ["seo-live-baseline", "npm", ["run", "seo-audit"], false],
    ["media", "npm", ["run", "media:integrity"], true],
  ],
  security: [
    ["rls", "npm", ["run", "rls-audit"], true],
    ["auth-readiness", "npm", ["run", "auth:readiness"], !process.env.CI],
  ],
  commerce: [
    [
      "booking-payment-integrity",
      "npx",
      [
        "vitest",
        "run",
        "src/lib/booking-create-command-integrity.test.ts",
        "src/lib/booking-cancellation-integrity.test.ts",
        "src/lib/booking-pricing.test.ts",
        "src/lib/booking-state-machine.test.ts",
        "src/lib/payments/payment-integrity.test.ts",
        "src/lib/payments/webhook-handler.test.ts",
        "src/lib/database-url.test.ts",
      ],
      true,
    ],
  ],
  journeys: [
    ["playwright-critical", "npm", ["run", "test:e2e:smoke"], true],
  ],
  production: [
    ["production-build", "npm", ["run", "build"], true],
    ["production-isolation", "node", ["scripts/scan-production-artifacts.mjs"], true],
  ],
};

if (requestedGroup && !groups[requestedGroup]) {
  console.error(`Unknown quality group: ${requestedGroup}`);
  process.exit(2);
}

fs.mkdirSync(logsDir, { recursive: true });
const groupNames = requestedGroup ? [requestedGroup] : Object.keys(groups);
const checks = [];
let blocked = false;

for (const group of groupNames) {
  for (const [id, command, args, blocking] of groups[group]) {
    const startedAt = Date.now();
    const logPath = path.join(logsDir, `${group}-${id}.log`);
    console.log(`\n[release-gate] ${group}:${id}`);
    const result = spawnSync(command, args, {
      cwd: root,
      env: {
        ...process.env,
        BUILD_TARGET: "production",
        DEPLOY_ENV: process.env.DEPLOY_ENV ?? "production",
        NEXT_PUBLIC_APP_MODE: process.env.NEXT_PUBLIC_APP_MODE ?? "production",
        NEXT_PUBLIC_ENABLE_DEMO_SEED: "false",
        NEXT_PUBLIC_SUPABASE_AUTH: process.env.NEXT_PUBLIC_SUPABASE_AUTH ?? "true",
        NEXT_PUBLIC_TOURS_SOURCE: process.env.NEXT_PUBLIC_TOURS_SOURCE ?? "supabase",
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.goargentina.ru",
        SEO_AUDIT_BASE_URL:
          process.env.SEO_AUDIT_BASE_URL ?? "https://www.goargentina.ru",
        PLAYWRIGHT_BASE_URL:
          process.env.PLAYWRIGHT_BASE_URL ?? "https://www.goargentina.ru",
      },
      encoding: "utf8",
      maxBuffer: 100 * 1024 * 1024,
    });
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    fs.writeFileSync(logPath, output, "utf8");
    process.stdout.write(output);
    const status = result.status === 0 ? "passed" : "failed";
    checks.push({
      id: `${group}:${id}`,
      group,
      status,
      durationMs: Date.now() - startedAt,
      blocking,
      artifact: path.relative(root, logPath),
      command: [command, ...args].join(" "),
    });
    if (status === "failed" && blocking) {
      blocked = true;
      break;
    }
  }
  if (blocked) break;
}

const shaResult = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" });
const report = {
  commitSha: process.env.GIT_SHA?.trim() || shaResult.stdout.trim() || null,
  timestamp: new Date().toISOString(),
  environment: process.env.VERCEL_ENV ?? process.env.DEPLOY_ENV ?? "local-production",
  requestedGroup: requestedGroup ?? "all",
  status: blocked ? "failed" : "passed",
  checks,
};
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`\nRelease gate: ${report.status}. Report: ${path.relative(root, reportPath)}`);
process.exit(blocked ? 1 : 0);
