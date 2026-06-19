import "server-only";

import fs from "node:fs";
import path from "node:path";
import { getDeployEnvironment } from "@/lib/ops/deploy-env";
import { getLatestMigrationId, getMigrationFileCount } from "@/lib/ops/migrations-version";
import {
  PRODUCTION_FORBIDDEN_TRUE_FLAGS,
  PRODUCTION_RECOMMENDED_ENV_VARS,
  PRODUCTION_REQUIRED_ENV_VARS,
} from "@/lib/ops/production-readiness-config";
import type {
  ProductionReadinessScriptReport,
  ProductionReadinessSnapshot,
  ReadinessCheckItem,
  ReadinessCheckStatus,
} from "@/lib/ops/production-readiness-types";
import { readOpsStatusSnapshot } from "@/lib/ops/ops-status";

export type {
  ProductionReadinessScriptReport,
  ProductionReadinessSnapshot,
  ReadinessCheckItem,
  ReadinessCheckStatus,
} from "@/lib/ops/production-readiness-types";

const SCRIPT_REPORT_FILE = path.join(process.cwd(), "var/ops/production-readiness-last.json");

function summarize(checks: ReadinessCheckItem[]) {
  return checks.reduce(
    (acc, check) => {
      acc[check.status] += 1;
      return acc;
    },
    { ok: 0, warn: 0, fail: 0, skip: 0 }
  );
}

function isTruthyEnv(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function readScriptReport(): ProductionReadinessScriptReport | null {
  if (!fs.existsSync(SCRIPT_REPORT_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(SCRIPT_REPORT_FILE, "utf8")) as ProductionReadinessScriptReport;
  } catch {
    return null;
  }
}

/** Lightweight checks runnable inside the deployed app (no shell, no secrets in output). */
export function runInlineProductionReadinessChecks(): ReadinessCheckItem[] {
  const checks: ReadinessCheckItem[] = [];
  const { deployEnv, nodeEnv } = getDeployEnvironment();
  const isProdLike = deployEnv === "production" || deployEnv === "staging" || nodeEnv === "production";

  for (const key of PRODUCTION_REQUIRED_ENV_VARS) {
    const present = Boolean(process.env[key]?.trim());
    let status: ReadinessCheckStatus = present ? "ok" : isProdLike ? "fail" : "warn";
    if (key === "DEPLOY_ENV" && present) {
      const value = process.env.DEPLOY_ENV?.trim().toLowerCase();
      if (value !== "staging" && value !== "production") {
        status = "fail";
      }
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

  for (const key of PRODUCTION_RECOMMENDED_ENV_VARS) {
    const present = Boolean(process.env[key]?.trim());
    checks.push({
      id: `env:recommended:${key}`,
      label: `Рекомендуется: ${key}`,
      status: present ? "ok" : isProdLike ? "warn" : "skip",
      message: present ? "Задана" : "Не задана (рекомендуется для production)",
      category: "env",
    });
  }

  for (const key of PRODUCTION_FORBIDDEN_TRUE_FLAGS) {
    const enabled = isTruthyEnv(process.env[key]);
    checks.push({
      id: `env:forbidden:${key}`,
      label: `${key}=false`,
      status: enabled ? "fail" : "ok",
      message: enabled ? "Демо-данные включены — недопустимо в production" : "Отключено",
      category: "security",
    });
  }

  const latestMigrationId = getLatestMigrationId();
  const fileCount = getMigrationFileCount();
  checks.push({
    id: "migrations:files",
    label: "Миграции в репозитории",
    status: fileCount > 0 ? "ok" : "fail",
    message:
      fileCount > 0
        ? `${fileCount} файлов, последняя: ${latestMigrationId ?? "—"}`
        : "Каталог supabase/migrations пуст",
    category: "database",
  });

  const ops = readOpsStatusSnapshot();
  checks.push({
    id: "security:rls-audit",
    label: "RLS-аудит (последний запуск)",
    status: ops.rlsAudit ? (ops.rlsAudit.ok ? "ok" : "fail") : isProdLike ? "warn" : "skip",
    message: ops.rlsAudit
      ? ops.rlsAudit.ok
        ? `OK (${ops.rlsAudit.ranAt})`
        : `${ops.rlsAudit.criticalIssueCount} критичных проблем (${ops.rlsAudit.ranAt})`
      : "Запустите: npm run rls-audit",
    category: "security",
  });

  const scriptReport = readScriptReport();
  if (scriptReport) {
    const tscCheck = scriptReport.checks.find((item) => item.id === "build:tsc");
    if (tscCheck) {
      checks.push({ ...tscCheck });
    }
    const migrationDbCheck = scriptReport.checks.find((item) => item.id === "migrations:db-count");
    if (migrationDbCheck) {
      checks.push({ ...migrationDbCheck });
    }
    const supabaseVerify = scriptReport.checks.find((item) => item.id === "smoke:supabase-verify");
    if (supabaseVerify) {
      checks.push({ ...supabaseVerify });
    }
  } else if (isProdLike) {
    checks.push({
      id: "build:script-report",
      label: "Отчёт production-readiness",
      status: "warn",
      message: "Запустите: npm run production-readiness",
      category: "build",
    });
  }

  return checks;
}

function mergeChecks(inline: ReadinessCheckItem[], script: ReadinessCheckItem[]): ReadinessCheckItem[] {
  const byId = new Map<string, ReadinessCheckItem>();
  for (const check of inline) {
    byId.set(check.id, check);
  }
  for (const check of script) {
    const existing = byId.get(check.id);
    if (!existing || check.status === "fail" || (check.status === "warn" && existing.status === "ok")) {
      byId.set(check.id, check);
    }
  }
  return [...byId.values()];
}

export function fetchProductionReadinessSnapshot(): ProductionReadinessSnapshot {
  const environment = getDeployEnvironment();
  const scriptReport = readScriptReport();
  const inlineChecks = runInlineProductionReadinessChecks();
  const checks = scriptReport
    ? mergeChecks(inlineChecks, scriptReport.checks)
    : inlineChecks;
  const summary = summarize(checks);

  return {
    ok: summary.fail === 0,
    ranAt: new Date().toISOString(),
    source: scriptReport ? "merged" : "inline",
    environment,
    checks,
    summary,
    scriptReport,
  };
}

export function getProductionReadinessReportPath(): string {
  return SCRIPT_REPORT_FILE;
}
