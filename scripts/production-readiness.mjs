#!/usr/bin/env node
/**
 * Production readiness checks before Supabase staging → production cutover (E72).
 *
 * Checks:
 * - required/recommended env vars (names only in output)
 * - DATABASE_URL connectivity + migration file count vs DB marker table (if present)
 * - static RLS audit (same rules as rls-audit.mjs)
 * - optional Supabase API smoke via running server (/api/health)
 * - TypeScript compile hint (npx tsc --noEmit)
 *
 * Writes var/ops/production-readiness-last.json for admin UI.
 *
 * Usage:
 *   node scripts/production-readiness.mjs
 *   npm run production-readiness
 *
 * Optional env:
 *   SMOKE_BASE_URL=http://127.0.0.1:3000
 *   SKIP_TSC=1
 *   SKIP_SUPABASE_VERIFY=1
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const opsDir = path.join(root, "var/ops");
const reportFile = path.join(opsDir, "production-readiness-last.json");
const migrationsDir = path.join(root, "supabase/migrations");

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "DEPLOY_ENV",
  "CRON_SECRET",
];

const RECOMMENDED_ENV = [
  "GIT_SHA",
  "SENTRY_DSN",
  "NEXT_PUBLIC_SENTRY_DSN",
  "RESEND_API_KEY",
  "LEADS_NOTIFY_EMAIL",
];

const FORBIDDEN_TRUE = ["NEXT_PUBLIC_ENABLE_DEMO_SEED"];

const SERVICE_ROLE_ONLY_TABLES = new Set([
  "api_key_usage_log",
  "affiliate_link_clicks",
  "booking_commission_snapshots",
  "payment_audit_log",
  "payment_transactions",
  "payout_records",
  "platform_commission_rules",
  "sputnik8_booking_requests",
  "sputnik8_sync_runs",
  "trip_prep_reminders_sent",
  "tripster_booking_requests",
  "tripster_sync_runs",
]);

const TABLE_RE = /create\s+table\s+if\s+not\s+exists\s+public\.([a-z0-9_]+)/gi;
const RLS_RE = /alter\s+table\s+public\.([a-z0-9_]+)\s+enable\s+row\s+level\s+security/gi;
const POLICY_RE = /create\s+policy\s+"[^"]+"\s+on\s+public\.([a-z0-9_]+)/gi;

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

function isTruthy(value) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function summarize(checks) {
  return checks.reduce(
    (acc, check) => {
      acc[check.status] += 1;
      return acc;
    },
    { ok: 0, warn: 0, fail: 0, skip: 0 }
  );
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
      criticalIssues.push({ table, kind: "missing_rls" });
      continue;
    }
    if (!SERVICE_ROLE_ONLY_TABLES.has(table) && !policyTables.has(table)) {
      criticalIssues.push({ table, kind: "missing_policies" });
    }
  }

  return { ok: criticalIssues.length === 0, tableCount: tables.length, criticalIssues };
}

function listMigrationFiles() {
  if (!fs.existsSync(migrationsDir)) return [];
  return fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();
}

async function checkDatabaseMigrations(fileCount, latestId) {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    return {
      id: "migrations:db-count",
      label: "Миграции в БД",
      status: "skip",
      message: "DATABASE_URL не задан — пропуск сравнения с БД",
      category: "database",
    };
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 12000,
  });

  try {
    await client.connect();

    const { rows: pingRows } = await client.query("select 1 as ok");
    if (!pingRows[0]?.ok) {
      return {
        id: "migrations:db-count",
        label: "Подключение к Postgres",
        status: "fail",
        message: "Не удалось выполнить ping",
        category: "database",
      };
    }

    let dbCount = null;
    let dbLatest = null;

    try {
      const { rows } = await client.query(
        "select count(*)::int as count, max(version) as latest from supabase_migrations.schema_migrations"
      );
      dbCount = rows[0]?.count ?? null;
      dbLatest = rows[0]?.latest ?? null;
    } catch {
      // schema_migrations may be absent when migrations applied via npm run supabase:migrate
    }

    if (dbCount == null) {
      const { rows } = await client.query(`
        select count(*)::int as count
        from pg_tables
        where schemaname = 'public'
      `);
      const publicTables = rows[0]?.count ?? 0;
      return {
        id: "migrations:db-count",
        label: "Миграции в БД",
        status: publicTables > 0 ? "warn" : "fail",
        message:
          publicTables > 0
            ? `Таблиц public: ${publicTables}. schema_migrations недоступна — сверьте вручную с ${fileCount} файлами (последняя: ${latestId})`
            : "В public нет таблиц — миграции не применены",
        category: "database",
      };
    }

    const countOk = dbCount === fileCount;
    const latestOk = !latestId || !dbLatest || String(dbLatest) === String(latestId);

    return {
      id: "migrations:db-count",
      label: "Миграции в БД vs файлы",
      status: countOk && latestOk ? "ok" : "fail",
      message: countOk
        ? `В БД ${dbCount} записей, в репозитории ${fileCount}. Последняя: ${dbLatest ?? latestId}`
        : `Несовпадение: БД ${dbCount}, файлов ${fileCount}. Последняя в БД: ${dbLatest ?? "—"}, в репо: ${latestId}`,
      category: "database",
    };
  } catch (error) {
    return {
      id: "migrations:db-count",
      label: "Подключение к Postgres",
      status: "fail",
      message: error instanceof Error ? error.message : "Ошибка подключения",
      category: "database",
    };
  } finally {
    await client.end().catch(() => {});
  }
}

async function checkHealthEndpoint() {
  if (process.env.SKIP_SUPABASE_VERIFY === "1") {
    return {
      id: "smoke:supabase-verify",
      label: "Smoke /api/health",
      status: "skip",
      message: "SKIP_SUPABASE_VERIFY=1",
      category: "smoke",
    };
  }

  const baseUrl = (process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");

  try {
    const res = await fetch(`${baseUrl}/api/health`, {
      signal: AbortSignal.timeout(12000),
    });
    const json = await res.json();

    if (res.status !== 200 && res.status !== 503) {
      return {
        id: "smoke:supabase-verify",
        label: "Smoke /api/health",
        status: "fail",
        message: `HTTP ${res.status} от ${baseUrl}`,
        category: "smoke",
      };
    }

    const dbOk = json.checks?.database?.ok;
    const dbSkipped = json.checks?.database?.skipped;
    const migrationId = json.migrationVersion ?? json.checks?.migrations?.latestId;

    return {
      id: "smoke:supabase-verify",
      label: "Smoke /api/health",
      status: dbSkipped ? "warn" : dbOk ? "ok" : "fail",
      message: dbSkipped
        ? `Ответ получен, БД не проверялась. migrationVersion=${migrationId ?? "—"}`
        : dbOk
          ? `OK. migrationVersion=${migrationId ?? "—"}, deployEnv=${json.environment?.deployEnv ?? "—"}`
          : `БД: ${json.checks?.database?.error ?? "ошибка"}`,
      category: "smoke",
    };
  } catch {
    return {
      id: "smoke:supabase-verify",
      label: "Smoke /api/health",
      status: "warn",
      message: `Сервер недоступен на ${baseUrl}. Запустите npm run dev или задайте SMOKE_BASE_URL`,
      category: "smoke",
    };
  }
}

function checkTsc() {
  if (process.env.SKIP_TSC === "1") {
    return {
      id: "build:tsc",
      label: "TypeScript (tsc --noEmit)",
      status: "skip",
      message: "SKIP_TSC=1",
      category: "build",
    };
  }

  const result = spawnSync("npx", ["tsc", "--noEmit"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status === 0) {
    return {
      id: "build:tsc",
      label: "TypeScript (tsc --noEmit)",
      status: "ok",
      message: "Компиляция без ошибок",
      category: "build",
    };
  }

  const hint = (result.stderr || result.stdout || "tsc failed").split("\n").slice(0, 3).join(" ");
  return {
    id: "build:tsc",
    label: "TypeScript (tsc --noEmit)",
    status: "fail",
    message: hint.trim() || "Ошибки TypeScript — см. npx tsc --noEmit",
    category: "build",
  };
}

async function main() {
  loadEnvLocal();

  const checks = [];
  const deployEnv = process.env.DEPLOY_ENV?.trim().toLowerCase();
  const isProdLike = deployEnv === "production" || deployEnv === "staging";

  for (const key of REQUIRED_ENV) {
    const present = Boolean(process.env[key]?.trim());
    let status = present ? "ok" : isProdLike ? "fail" : "warn";
    if (key === "DEPLOY_ENV" && present && deployEnv !== "staging" && deployEnv !== "production") {
      status = "fail";
    }
    checks.push({
      id: `env:${key}`,
      label: `Переменная ${key}`,
      status,
      message: present
        ? key === "DEPLOY_ENV"
          ? `DEPLOY_ENV=${process.env.DEPLOY_ENV?.trim()}`
          : "Задана"
        : "Не задана",
      category: "env",
    });
  }

  for (const key of RECOMMENDED_ENV) {
    const present = Boolean(process.env[key]?.trim());
    checks.push({
      id: `env:recommended:${key}`,
      label: `Рекомендуется: ${key}`,
      status: present ? "ok" : isProdLike ? "warn" : "skip",
      message: present ? "Задана" : "Не задана",
      category: "env",
    });
  }

  for (const key of FORBIDDEN_TRUE) {
    const enabled = isTruthy(process.env[key]);
    checks.push({
      id: `env:forbidden:${key}`,
      label: `${key}=false`,
      status: enabled ? "fail" : "ok",
      message: enabled ? "Демо-данные включены" : "Отключено",
      category: "security",
    });
  }

  const migrationFiles = listMigrationFiles();
  const latestId = migrationFiles.at(-1)?.replace(/\.sql$/, "") ?? null;
  checks.push({
    id: "migrations:files",
    label: "Миграции в репозитории",
    status: migrationFiles.length > 0 ? "ok" : "fail",
    message:
      migrationFiles.length > 0
        ? `${migrationFiles.length} файлов, последняя: ${latestId}`
        : "Каталог пуст",
    category: "database",
  });

  const rls = runStaticRlsAudit();
  checks.push({
    id: "security:rls-audit",
    label: "Статический RLS-аудит",
    status: rls.ok ? "ok" : "fail",
    message: rls.ok
      ? `${rls.tableCount} таблиц, критичных проблем нет`
      : `${rls.criticalIssues.length} критичных проблем — npm run rls-audit`,
    category: "security",
  });

  checks.push(await checkDatabaseMigrations(migrationFiles.length, latestId));
  checks.push(await checkHealthEndpoint());
  checks.push(checkTsc());

  const summary = summarize(checks);
  const payload = {
    ok: summary.fail === 0,
    ranAt: new Date().toISOString(),
    gitSha: process.env.GIT_SHA?.trim() || null,
    checks,
    summary,
  };

  fs.mkdirSync(opsDir, { recursive: true });
  fs.writeFileSync(reportFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log("Production readiness (E72)");
  console.log(`DEPLOY_ENV=${deployEnv ?? "(не задан)"}  NODE_ENV=${process.env.NODE_ENV ?? "development"}`);
  console.log(`Checks: OK ${summary.ok}, warn ${summary.warn}, fail ${summary.fail}, skip ${summary.skip}`);
  console.log("");

  for (const check of checks) {
    const icon =
      check.status === "ok" ? "✓" : check.status === "fail" ? "✗" : check.status === "warn" ? "!" : "–";
    console.log(`${icon} [${check.status}] ${check.label}: ${check.message}`);
  }

  console.log("");
  console.log(`Report: ${path.relative(root, reportFile)}`);

  if (!payload.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
