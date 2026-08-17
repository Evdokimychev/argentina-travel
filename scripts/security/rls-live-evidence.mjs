#!/usr/bin/env node
/**
 * Live RLS evidence harness.
 *
 * Fails clearly with EXTERNAL_BLOCKER when DB credentials are unavailable.
 * Never invents a PASS from static migrations alone.
 *
 * Usage: node scripts/security/rls-live-evidence.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUTPUT = path.join(ROOT, "var/ops/rls-live-evidence.json");

function resolveDatabaseUrl(env = process.env) {
  return (
    env.RLS_LIVE_DATABASE_URL?.trim() ||
    env.DATABASE_URL?.trim() ||
    env.POSTGRES_URL_NON_POOLING?.trim() ||
    ""
  );
}

export function buildRlsLiveEvidenceReport(options = {}) {
  const env = options.env ?? process.env;
  const databaseUrl = resolveDatabaseUrl(env);
  const staticAuditScript = path.join(ROOT, "scripts/rls-audit.mjs");

  const report = {
    schemaVersion: 1,
    kind: "rls-live-evidence",
    generatedAt: new Date().toISOString(),
    evidenceLevel: "live_required",
    staticCompanion: fs.existsSync(staticAuditScript)
      ? "scripts/rls-audit.mjs (static migrations only — not live proof)"
      : null,
    status: "EXTERNAL_BLOCKER",
    blocker: null,
    live: {
      connected: false,
      tablesChecked: 0,
      rlsEnabledCount: 0,
      policyCount: 0,
    },
  };

  if (!databaseUrl) {
    report.blocker = {
      code: "EXTERNAL_BLOCKER",
      message:
        "No database credentials available for live RLS evidence. Static rls-audit is not a substitute for live proof.",
      requiredEnv: ["RLS_LIVE_DATABASE_URL or DATABASE_URL / POSTGRES_URL_NON_POOLING"],
    };
    return report;
  }

  if (env.RLS_LIVE_EVIDENCE !== "1") {
    report.blocker = {
      code: "EXTERNAL_BLOCKER",
      message:
        "Database URL present but RLS_LIVE_EVIDENCE=1 not set. Refusing live query without explicit opt-in; not a PASS.",
    };
    return report;
  }

  report.blocker = {
    code: "EXTERNAL_BLOCKER",
    message:
      "Opt-in set, but live RLS probe against production/staging remains operator-gated while external DB access is blocked. Do not fake PASS.",
  };
  return report;
}

function main() {
  const report = buildRlsLiveEvidenceReport();
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true, mode: 0o700 });
  fs.writeFileSync(OUTPUT, `${JSON.stringify(report, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  console.log(
    JSON.stringify({
      status: report.status,
      output: path.relative(ROOT, OUTPUT),
      blocker: report.blocker?.code ?? null,
      message: report.blocker?.message ?? null,
    }),
  );
  process.exitCode = 2;
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main();
}
