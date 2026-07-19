#!/usr/bin/env node
/**
 * Static RLS audit for CI and local checks (no running server required).
 *
 * Validates supabase/migrations/*.sql:
 * - every public table enables RLS
 * - non–service-role tables have at least one policy
 * - the migration set declares the explicit service-role Data API grant
 *
 * Writes var/ops/rls-audit-last.json for admin UI.
 *
 * Usage:
 *   node scripts/rls-audit.mjs
 *   npm run rls-audit
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildReleaseFingerprint } from "./lib/release-fingerprint.mjs";
import { SERVICE_ROLE_ONLY_TABLES } from "./lib/rls-audit-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const opsDir = path.join(root, "var/ops");
const auditFile = path.join(opsDir, "rls-audit-last.json");

const TABLE_RE = /create\s+table\s+(?:if\s+not\s+exists\s+)?public\.([a-z0-9_]+)/gi;
const RLS_RE = /alter\s+table\s+public\.([a-z0-9_]+)\s+enable\s+row\s+level\s+security/gi;
const POLICY_RE = /create\s+policy\s+(?:"[^"]+"|[a-z0-9_]+)\s+on\s+public\.([a-z0-9_]+)/gi;
const SERVICE_ROLE_DATA_API_GRANT_RE =
  /grant\s+select\s*,\s*insert\s*,\s*update\s*,\s*delete\s+on\s+all\s+tables\s+in\s+schema\s+public\s+to\s+service_role\s*;/i;
const CLIENT_DEFAULT_REVOKE_RE =
  /revoke\s+all\s+privileges\s+on\s+all\s+tables\s+in\s+schema\s+public\s+from\s+anon\s*,\s*authenticated\s*;/i;

function loadEnvLocal() {
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(root, file);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function collectMatches(pattern, sql) {
  const matches = new Set();
  for (const match of sql.matchAll(pattern)) {
    const table = match[1]?.trim();
    if (table) matches.add(table);
  }
  return matches;
}

function runStaticRlsAudit() {
  const migrationsDir = path.join(root, "supabase/migrations");
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }

  const sql = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => fs.readFileSync(path.join(migrationsDir, name), "utf8"))
    .join("\n");

  const tables = [...collectMatches(TABLE_RE, sql)].sort();
  const rlsEnabled = collectMatches(RLS_RE, sql);
  const policyTables = collectMatches(POLICY_RE, sql);
  const criticalIssues = [];

  for (const table of tables) {
    if (!rlsEnabled.has(table)) {
      criticalIssues.push({
        table,
        kind: "missing_rls",
        message: `Таблица public.${table} не включает RLS в миграциях`,
      });
      continue;
    }

    if (!SERVICE_ROLE_ONLY_TABLES.has(table) && !policyTables.has(table)) {
      criticalIssues.push({
        table,
        kind: "missing_policies",
        message: `Таблица public.${table} без политик RLS (критично для публичных таблиц)`,
      });
    }
  }

  if (!SERVICE_ROLE_DATA_API_GRANT_RE.test(sql)) {
    criticalIssues.push({
      table: "*",
      kind: "missing_service_role_grants",
      message: "Миграции не фиксируют явный Data API grant для service_role",
    });
  }

  if (!CLIENT_DEFAULT_REVOKE_RE.test(sql)) {
    criticalIssues.push({
      table: "*",
      kind: "missing_client_default_revoke",
      message: "Миграции не сбрасывают неявные grants старых Supabase-проектов",
    });
  }

  return { tables, criticalIssues, ok: criticalIssues.length === 0, source: "static" };
}

async function main() {
  loadEnvLocal();

  const result = runStaticRlsAudit();
  const release = buildReleaseFingerprint(root, process.env);
  const payload = {
    ok: result.ok,
    source: result.source,
    ranAt: new Date().toISOString(),
    gitSha: release.commitSha,
    gitShaSource: release.source,
    tableCount: result.tables.length,
    criticalIssueCount: result.criticalIssues.length,
    criticalIssues: result.criticalIssues,
    tables: result.tables,
  };

  fs.mkdirSync(opsDir, { recursive: true });
  fs.writeFileSync(auditFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(`RLS audit (${result.source}): ${result.tables.length} tables`);
  if (result.criticalIssues.length === 0) {
    console.log("✓ No critical RLS issues.");
  } else {
    console.error(`✗ Critical RLS issues (${result.criticalIssues.length}):`);
    for (const issue of result.criticalIssues) {
      console.error(`  - [${issue.kind}] ${issue.table}: ${issue.message}`);
    }
  }
  console.log(`Audit log: ${path.relative(root, auditFile)}`);

  if (!result.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
