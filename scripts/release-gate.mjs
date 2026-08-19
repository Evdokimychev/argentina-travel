#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import nextEnv from "@next/env";
import {
  captureCandidateContext,
  finalizeCandidateEvidence,
} from "./lib/candidate-evidence.mjs";
import { releaseGateCheckEnv } from "./lib/release-gate-env.mjs";
import { buildReleaseFingerprint } from "./lib/release-fingerprint.mjs";

const root = process.cwd();
nextEnv.loadEnvConfig(root, false);
const canonicalReportPath = path.join(root, "var/ops/release-gate-report.json");
const logsDir = path.join(root, "var/ops/release-gate-logs");
const requestedGroupRaw = process.argv.includes("--group")
  ? process.argv[process.argv.indexOf("--group") + 1]
  : null;
const requestedGroups = requestedGroupRaw
  ? requestedGroupRaw.split(",").map((value) => value.trim()).filter(Boolean)
  : null;
const candidateContext = captureCandidateContext(root);
const sourceFingerprint = buildReleaseFingerprint(root, process.env);

const groups = {
  static: [
    ["environment", "node", ["scripts/validate-build-mode.mjs"], true],
    ["secrets", "node", ["scripts/audit-secrets.mjs"], true],
    ["dependency-audit-policy", "npm", ["run", "audit:deps:policy"], true],
    [
      "release-evidence-contracts",
      "node",
      [
        "--test",
        "scripts/lib/candidate-evidence.test.mjs",
        "scripts/lib/critical-public-media.test.mjs",
        "scripts/lib/commercial-catalog-smoke.test.mjs",
        "scripts/lib/data-api-grants.test.mjs",
        "scripts/lib/dependency-audit-policy.test.mjs",
        "scripts/lib/lighthouse-budget-policy.test.mjs",
        "scripts/lib/migration-journal.test.mjs",
        "scripts/lib/ops-report-evidence.test.mjs",
        "scripts/kb-source-health.test.mjs",
        "scripts/lib/release-gate-content-contract.test.mjs",
        "scripts/lib/release-gate-env.test.mjs",
        "scripts/lib/seo-schema-contract.test.mjs",
      ],
      true,
    ],
    ["typescript", "npx", ["tsc", "--noEmit"], true],
    ["lint", "npm", ["run", "lint"], true],
    ["product-surface-inventory", "npm", ["run", "inventory:check"], true],
    ["architecture-boundaries", "node", ["scripts/architecture-boundaries.mjs"], true],
  ],
  contracts: [
    ["unit-integration-contracts", "npm", ["test"], true],
    ["manual-content-sync", "npm", ["run", "sync-manual-posts:check"], true],
    ["rich-content-sync", "npm", ["run", "sync-rich-articles:check"], true],
    ["redirect-contracts", "npm", ["run", "sync-content-plan-redirects:check"], true],
  ],
  content: [
    [
      "knowledge-provenance",
      "python3",
      ["content/knowledge-base/_index/build_manifest.py", "--strict-provenance"],
      true,
    ],
    ["blog-editorial-readiness", "npm", ["run", "blog:editorial-readiness:check"], true],
    ["guide-editorial-readiness", "npm", ["run", "guide:editorial-readiness:check"], true],
    ["content-lint", "npm", ["run", "content:audit"], true],
    ["seo-live-baseline", "npm", ["run", "seo-audit"], false],
    ["media", "npm", ["run", "media:integrity"], true],
    ["critical-public-media", "npm", ["run", "media:critical:check"], true],
    ["media-rights", "npm", ["run", "media:rights:check"], true],
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
        "src/lib/booking-create-pricing.test.ts",
        "src/lib/booking-state-machine.test.ts",
        "src/lib/payments/payment-integrity.test.ts",
        "src/lib/payments/webhook-handler.test.ts",
        "src/lib/payments/payment-idempotency.test.ts",
        "src/lib/payments/provider-contract.test.ts",
        "src/lib/database-url.test.ts",
      ],
      true,
    ],
  ],
  journeys: [
    ["playwright-critical", "npm", ["run", "test:e2e:smoke"], true],
    ["playwright-a11y-public", "npm", ["run", "test:e2e:a11y"], true],
  ],
  production: [
    ["production-build", "npm", ["run", "build"], true],
    ["production-isolation", "node", ["scripts/scan-production-artifacts.mjs"], true],
  ],
};

if (requestedGroups) {
  for (const group of requestedGroups) {
    if (!groups[group]) {
      console.error(`Unknown quality group: ${group}`);
      process.exit(2);
    }
  }
}

fs.mkdirSync(logsDir, { recursive: true });
const groupNames = requestedGroups?.length
  ? requestedGroups
  : ["static", "contracts", "content", "security", "commerce", "production", "journeys"];
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
        // A live production comparison is informative, but it must never
        // overwrite the canonical SEO evidence generated for this candidate.
        ...releaseGateCheckEnv(id),
        // Leave Playwright unset for local/CI gates so its config starts the
        // candidate application. A deployed environment can still be supplied
        // explicitly by the caller.
        ...(process.env.PLAYWRIGHT_BASE_URL
          ? { PLAYWRIGHT_BASE_URL: process.env.PLAYWRIGHT_BASE_URL }
          : {}),
        ...(group === "journeys" ? { PLAYWRIGHT_RELEASE_GATE: "true" } : {}),
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

const candidateEvidence = finalizeCandidateEvidence(root, candidateContext, {
  environment: process.env.EVIDENCE_ENVIRONMENT ?? "local-production",
  baseUrl: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
});
if (candidateEvidence.evidenceIntegrity.status !== "passed") {
  blocked = true;
  checks.push({
    id: "static:candidate-integrity",
    group: "static",
    status: "failed",
    durationMs: 0,
    blocking: true,
    artifact: null,
    command: "verify candidate snapshot remained unchanged",
    reasons: candidateEvidence.evidenceIntegrity.reasons,
  });
}
const report = {
  schemaVersion: 3,
  ...candidateEvidence,
  commitSha: sourceFingerprint.commitSha,
  commitShaSource: sourceFingerprint.source,
  sourceFingerprint,
  timestamp: new Date().toISOString(),
  environment: process.env.VERCEL_ENV ?? process.env.DEPLOY_ENV ?? "local-production",
  requestedGroup: requestedGroups?.join(",") ?? "all",
  status: blocked ? "failed" : "passed",
  checks,
};
const reportPath = requestedGroups?.length
  ? path.join(root, "var/ops", `release-gate-${requestedGroups.join("-")}-last.json`)
  : canonicalReportPath;
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`\nRelease gate: ${report.status}. Report: ${path.relative(root, reportPath)}`);
process.exit(blocked ? 1 : 0);
