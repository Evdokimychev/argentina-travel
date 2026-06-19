import fs from "node:fs";
import path from "node:path";
import { isServiceRoleOnlyTable } from "@/lib/supabase/rls-audit-config";

export type StaticRlsAuditIssue = {
  table: string;
  kind: "missing_rls" | "missing_policies";
  message: string;
};

export type StaticRlsAuditResult = {
  ok: boolean;
  source: "static";
  tables: string[];
  issues: StaticRlsAuditIssue[];
  criticalIssues: StaticRlsAuditIssue[];
};

const TABLE_RE = /create\s+table\s+if\s+not\s+exists\s+public\.([a-z0-9_]+)/gi;
const RLS_RE = /alter\s+table\s+public\.([a-z0-9_]+)\s+enable\s+row\s+level\s+security/gi;
const POLICY_RE = /create\s+policy\s+"[^"]+"\s+on\s+public\.([a-z0-9_]+)/gi;

function readMigrationSql(rootDir: string): string {
  const migrationsDir = path.join(rootDir, "supabase/migrations");
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }

  return fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => fs.readFileSync(path.join(migrationsDir, name), "utf8"))
    .join("\n");
}

function collectMatches(pattern: RegExp, sql: string): Set<string> {
  const matches = new Set<string>();
  for (const match of sql.matchAll(pattern)) {
    const table = match[1]?.trim();
    if (table) matches.add(table);
  }
  return matches;
}

export function runStaticRlsAudit(rootDir = process.cwd()): StaticRlsAuditResult {
  const sql = readMigrationSql(rootDir);
  const tables = [...collectMatches(TABLE_RE, sql)].sort();
  const rlsEnabled = collectMatches(RLS_RE, sql);
  const policyTables = collectMatches(POLICY_RE, sql);

  const issues: StaticRlsAuditIssue[] = [];

  for (const table of tables) {
    if (!rlsEnabled.has(table)) {
      issues.push({
        table,
        kind: "missing_rls",
        message: `Таблица public.${table} не включает RLS в миграциях`,
      });
      continue;
    }

    if (!isServiceRoleOnlyTable(table) && !policyTables.has(table)) {
      issues.push({
        table,
        kind: "missing_policies",
        message: `Таблица public.${table} без политик RLS (критично для публичных таблиц)`,
      });
    }
  }

  return {
    ok: issues.length === 0,
    source: "static",
    tables,
    issues,
    criticalIssues: issues,
  };
}
