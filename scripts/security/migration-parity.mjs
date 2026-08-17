#!/usr/bin/env node
/**
 * Migration parity tooling: compare local supabase/migrations journal to a reported target.
 *
 * Dry-run mode (default when no DB credentials): emits local inventory + EXTERNAL_BLOCKER
 * for live journal comparison. Never invents a live PASS.
 *
 * Usage:
 *   node scripts/security/migration-parity.mjs
 *   node scripts/security/migration-parity.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrationChecksum, migrationSetChecksum } from "../lib/migration-journal.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUTPUT = path.join(ROOT, "var/ops/migration-parity.json");

function loadLocalMigrations(root = ROOT) {
  const migrationsDir = path.join(root, "supabase/migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  return files.map((fileName) => {
    const sql = fs.readFileSync(path.join(migrationsDir, fileName), "utf8");
    const id = fileName.replace(/\.sql$/, "");
    return { id, fileName, checksum: migrationChecksum(sql), bytes: Buffer.byteLength(sql) };
  });
}

function resolveDatabaseUrl(env = process.env) {
  return (
    env.MIGRATION_PARITY_DATABASE_URL?.trim() ||
    env.DATABASE_URL?.trim() ||
    env.POSTGRES_URL_NON_POOLING?.trim() ||
    ""
  );
}

export function buildMigrationParityReport(options = {}) {
  const env = options.env ?? process.env;
  const dryRun = options.dryRun ?? true;
  const localMigrations = loadLocalMigrations();
  const localSetChecksum = migrationSetChecksum(localMigrations);
  const databaseUrl = resolveDatabaseUrl(env);

  const report = {
    schemaVersion: 1,
    kind: "migration-parity",
    generatedAt: new Date().toISOString(),
    mode: dryRun || !databaseUrl ? "dry-run" : "live",
    local: {
      count: localMigrations.length,
      latestId: localMigrations.at(-1)?.id ?? null,
      setChecksum: localSetChecksum,
      migrations: localMigrations.map(({ id, checksum, bytes }) => ({ id, checksum, bytes })),
    },
    target: null,
    comparison: null,
    status: "EXTERNAL_BLOCKER",
    blocker: null,
  };

  if (!databaseUrl || dryRun) {
    report.blocker = {
      code: "EXTERNAL_BLOCKER",
      message:
        "Live migration journal comparison requires attested DB credentials. Local inventory only; not a live PASS.",
      requiredEnv: ["MIGRATION_PARITY_DATABASE_URL or DATABASE_URL / POSTGRES_URL_NON_POOLING"],
    };
    return report;
  }

  // Live path is intentionally not auto-run without explicit confirmation env —
  // this keeps the default fail-closed for blocked production environments.
  if (env.MIGRATION_PARITY_LIVE !== "1") {
    report.blocker = {
      code: "EXTERNAL_BLOCKER",
      message:
        "Database URL present but MIGRATION_PARITY_LIVE=1 not set. Refusing to query live journal without explicit opt-in.",
    };
    return report;
  }

  report.status = "LIVE_QUERY_NOT_IMPLEMENTED_IN_DEFAULT_HARNESS";
  report.blocker = {
    code: "EXTERNAL_BLOCKER",
    message:
      "Opt-in live query flag set, but this harness still requires operator-run apply/journal tooling when DB is reachable. Do not treat as PASS.",
  };
  return report;
}

function main() {
  const dryRun = process.argv.includes("--dry-run") || !resolveDatabaseUrl();
  const report = buildMigrationParityReport({ dryRun });
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true, mode: 0o700 });
  fs.writeFileSync(OUTPUT, `${JSON.stringify(report, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  console.log(
    JSON.stringify({
      status: report.status,
      mode: report.mode,
      localCount: report.local.count,
      setChecksum: report.local.setChecksum,
      output: path.relative(ROOT, OUTPUT),
      blocker: report.blocker?.code ?? null,
    }),
  );
  if (report.status === "EXTERNAL_BLOCKER") process.exitCode = 2;
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main();
}
