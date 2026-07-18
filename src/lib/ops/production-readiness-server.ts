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
import { getGitSha } from "@/lib/monitoring/build-info";

export type {
  ProductionReadinessScriptReport,
  ProductionReadinessSnapshot,
  ReadinessCheckItem,
  ReadinessCheckStatus,
} from "@/lib/ops/production-readiness-types";

const SCRIPT_REPORT_FILE = path.join(process.cwd(), "var/ops/production-readiness-last.json");
const RESTORE_EVIDENCE_DIR = path.join(process.cwd(), "var/restore-rehearsal");
const REPORT_MAX_AGE_MS = 26 * 60 * 60 * 1000;
const BACKUP_MAX_AGE_MS = 26 * 60 * 60 * 1000;
const RESTORE_MAX_AGE_MS = 35 * 24 * 60 * 60 * 1000;

type RestoreRehearsalEvidence = {
  kind?: string;
  checkedAt?: string;
  status?: string;
  encryptedArtifactVerified?: boolean;
  comparison?: { status?: string };
};

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

function readLatestRestoreEvidence(): RestoreRehearsalEvidence | null {
  if (!fs.existsSync(RESTORE_EVIDENCE_DIR)) return null;
  try {
    const candidates = fs.readdirSync(RESTORE_EVIDENCE_DIR)
      .filter((name) => /^verification-[a-z0-9._-]+\.json$/i.test(name))
      .map((name) => readJsonEvidence(path.join(RESTORE_EVIDENCE_DIR, name)))
      .filter((value): value is RestoreRehearsalEvidence => value !== null)
      .sort((a, b) => Date.parse(b.checkedAt ?? "") - Date.parse(a.checkedAt ?? ""));
    return candidates[0] ?? null;
  } catch {
    return null;
  }
}

function readJsonEvidence(filePath: string): RestoreRehearsalEvidence | null {
  try {
    const value = JSON.parse(fs.readFileSync(filePath, "utf8")) as RestoreRehearsalEvidence;
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
}

function isFreshTimestamp(value: string | null | undefined, now: number, maxAgeMs: number): boolean {
  const timestamp = value ? Date.parse(value) : Number.NaN;
  const age = now - timestamp;
  return Number.isFinite(timestamp) && age >= 0 && age <= maxAgeMs;
}

export function buildRecoveryReadinessCheck(input: {
  backupProductionReady: boolean;
  backupVerifiedAt: string | null;
  restoreVerifiedAt: string | null;
  restoreEvidence: RestoreRehearsalEvidence | null;
  isProdLike: boolean;
  now: number;
}): ReadinessCheckItem {
  const backupFresh = isFreshTimestamp(input.backupVerifiedAt, input.now, BACKUP_MAX_AGE_MS);
  const restoreTimestampFresh = isFreshTimestamp(
    input.restoreVerifiedAt,
    input.now,
    RESTORE_MAX_AGE_MS,
  );
  const evidenceFresh = isFreshTimestamp(
    input.restoreEvidence?.checkedAt,
    input.now,
    RESTORE_MAX_AGE_MS,
  );
  const evidencePassed = input.restoreEvidence?.kind === "supabase-restore-verification"
    && input.restoreEvidence.status === "passed"
    && input.restoreEvidence.encryptedArtifactVerified === true
    && input.restoreEvidence.comparison?.status === "passed";
  const ready = input.backupProductionReady
    && backupFresh
    && restoreTimestampFresh
    && evidenceFresh
    && evidencePassed;

  let message = "Резервная копия и контрольное восстановление подтверждены свежими доказательствами.";
  if (!backupFresh) {
    message = "Нет подтверждения резервной копии данных за последние 26 часов.";
  } else if (!restoreTimestampFresh) {
    message = "Дата контрольного восстановления отсутствует или старше 35 дней.";
  } else if (!input.restoreEvidence) {
    message = "Не найден отчёт фактического контрольного восстановления.";
  } else if (!evidencePassed) {
    message = "Отчёт контрольного восстановления не подтверждает успешный результат.";
  } else if (!evidenceFresh) {
    message = "Отчёт контрольного восстановления старше 35 дней.";
  } else if (!input.backupProductionReady) {
    message = "Режим резервирования ещё не подтверждён для публикации.";
  }

  return {
    id: "recovery:backup-restore",
    label: "Резервная копия и восстановление",
    status: ready ? "ok" : input.isProdLike ? "fail" : "warn",
    message,
    category: "database",
  };
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
      : "Проверка доступа к данным ещё не подтверждена для этого релиза.",
    category: "security",
  });
  checks.push(buildRecoveryReadinessCheck({
    backupProductionReady: ops.backup.productionReady,
    backupVerifiedAt: process.env.SUPABASE_BACKUP_VERIFIED_AT?.trim() || null,
    restoreVerifiedAt: ops.backup.restoreVerifiedAt,
    restoreEvidence: readLatestRestoreEvidence(),
    isProdLike,
    now: Date.now(),
  }));

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
      message: "Полная проверка текущего релиза ещё не выполнена.",
      category: "build",
    });
  }

  return checks;
}

function buildEvidenceChecks(input: {
  scriptReport: ProductionReadinessScriptReport | null;
  currentGitSha: string | null;
  isProdLike: boolean;
  now: number;
}): ReadinessCheckItem[] {
  if (!input.scriptReport) {
    return [{
      id: "evidence:report",
      label: "Свежая проверка текущего релиза",
      status: input.isProdLike ? "fail" : "warn",
      message: "Полная проверка этого релиза ещё не подтверждена.",
      category: "build",
    }];
  }

  const ranAt = Date.parse(input.scriptReport.ranAt);
  const fresh = Number.isFinite(ranAt) && input.now - ranAt >= 0 && input.now - ranAt <= REPORT_MAX_AGE_MS;
  const checks: ReadinessCheckItem[] = [{
    id: "evidence:freshness",
    label: "Свежесть полной проверки",
    status: fresh ? "ok" : input.isProdLike ? "fail" : "warn",
    message: fresh
      ? "Проверка выполнена менее 26 часов назад."
      : "Отчёт устарел или имеет некорректную дату — нужна повторная проверка.",
    category: "build",
  }];

  const sameRelease = Boolean(
    input.currentGitSha
    && input.scriptReport.gitSha
    && (
      input.currentGitSha.startsWith(input.scriptReport.gitSha)
      || input.scriptReport.gitSha.startsWith(input.currentGitSha)
    )
  );
  checks.push({
    id: "evidence:release",
    label: "Проверен именно опубликованный релиз",
    status: sameRelease ? "ok" : input.isProdLike ? "fail" : "warn",
    message: sameRelease
      ? "Версия отчёта совпадает с версией приложения."
      : "Совпадение версии отчёта и текущего приложения не подтверждено.",
    category: "build",
  });
  return checks;
}

export function classifyProductionReadiness(input: {
  checks: ReadinessCheckItem[];
  isProdLike: boolean;
}): ProductionReadinessSnapshot["state"] {
  if (input.checks.some((check) => check.status === "fail")) return "blocked";
  if (!input.isProdLike) return "local_passed";
  const recovery = input.checks.find((check) => check.id === "recovery:backup-restore");
  if (!recovery || recovery.status !== "ok") return "needs_verification";
  if (input.checks.some((check) => check.status === "warn" || check.status === "skip")) {
    return "needs_verification";
  }
  return "ready_to_publish";
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
  const isProdLike = environment.deployEnv === "production"
    || environment.deployEnv === "staging"
    || environment.nodeEnv === "production";
  const scriptReport = readScriptReport();
  const inlineChecks = runInlineProductionReadinessChecks();
  const mergedChecks = scriptReport
    ? mergeChecks(inlineChecks, scriptReport.checks)
    : inlineChecks;
  const checks = [
    ...mergedChecks,
    ...buildEvidenceChecks({
      scriptReport,
      currentGitSha: getGitSha(),
      isProdLike,
      now: Date.now(),
    }),
  ];
  const summary = summarize(checks);
  const state = classifyProductionReadiness({ checks, isProdLike });

  return {
    ok: state === "ready_to_publish",
    state,
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
