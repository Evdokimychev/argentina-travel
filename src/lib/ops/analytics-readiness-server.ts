import "server-only";

import fs from "node:fs";
import path from "node:path";
import { getGitSha } from "@/lib/monitoring/build-info";
import type {
  AnalyticsReadinessScriptReport,
  AnalyticsReadinessSnapshot,
} from "@/lib/ops/analytics-readiness-types";

export type {
  AnalyticsReadinessCheckItem,
  AnalyticsReadinessCheckStatus,
  AnalyticsReadinessScriptReport,
  AnalyticsReadinessSnapshot,
} from "@/lib/ops/analytics-readiness-types";

const SCRIPT_REPORT_FILE = path.join(process.cwd(), "var/ops/analytics-readiness-last.json");
const REPORT_MAX_AGE_MS = 26 * 60 * 60 * 1000;
const DEFAULT_SITE_URL = "https://www.goargentina.ru";

type ReportValidationOptions = {
  now?: Date;
  expectedBaseUrl?: string;
  expectedGitSha?: string | null;
};

function normalizeOrigin(value: string | null | undefined): string | null {
  try {
    return value ? new URL(value).origin : null;
  } catch {
    return null;
  }
}

function shaMatches(actual: string, expected: string): boolean {
  const left = actual.trim().toLowerCase();
  const right = expected.trim().toLowerCase();
  return left.length >= 7 && right.length >= 7 && (left.startsWith(right) || right.startsWith(left));
}

export function validateAnalyticsReadinessReport(
  report: AnalyticsReadinessScriptReport,
  options: ReportValidationOptions = {},
): string[] {
  const reasons: string[] = [];
  const now = options.now ?? new Date();
  const generatedAt = Date.parse(report.generatedAt ?? "");
  if (!Number.isFinite(generatedAt)) {
    reasons.push("missing_generated_at");
  } else if (generatedAt > now.getTime() + 5 * 60 * 1000) {
    reasons.push("future_report");
  } else if (now.getTime() - generatedAt > REPORT_MAX_AGE_MS) {
    reasons.push("stale_report");
  }

  const expectedOrigin = normalizeOrigin(options.expectedBaseUrl ?? DEFAULT_SITE_URL);
  const reportOrigin = normalizeOrigin(report.baseUrl);
  if (!reportOrigin) reasons.push("missing_base_url");
  if (reportOrigin && expectedOrigin && reportOrigin !== expectedOrigin) {
    reasons.push("base_url_mismatch");
  }

  const expectedGitSha = options.expectedGitSha;
  if (!expectedGitSha) {
    reasons.push("runtime_git_sha_missing");
  } else if (!report.gitSha) {
    reasons.push("report_git_sha_missing");
  } else if (!shaMatches(report.gitSha, expectedGitSha)) {
    reasons.push("git_sha_mismatch");
  }

  return [...new Set(reasons)];
}

export function readAnalyticsReadinessReport(): AnalyticsReadinessScriptReport | null {
  if (!fs.existsSync(SCRIPT_REPORT_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(SCRIPT_REPORT_FILE, "utf8")) as AnalyticsReadinessScriptReport;
  } catch {
    return null;
  }
}

export function fetchAnalyticsReadinessSnapshot(): AnalyticsReadinessSnapshot {
  const scriptReport = readAnalyticsReadinessReport();
  const now = new Date();
  const expectedBaseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? DEFAULT_SITE_URL;
  if (!scriptReport) {
    return {
      ok: false,
      generatedAt: now.toISOString(),
      ranAt: now.toISOString(),
      baseUrl: expectedBaseUrl,
      checks: [
        {
          id: "script:missing",
          label: "Отчёт analytics-readiness",
          status: "warn",
          message: "Запустите: ANALYTICS_BASE_URL=https://www.goargentina.ru npm run analytics-readiness",
          category: "manual",
        },
      ],
      summary: { ok: 0, warn: 1, fail: 0, skip: 0 },
      runbook: "docs/i2-analytics-gsc-runbook.md",
      source: "missing",
    };
  }

  const rejectionReasons = validateAnalyticsReadinessReport(scriptReport, {
    now,
    expectedBaseUrl,
    expectedGitSha: getGitSha(),
  });
  if (rejectionReasons.length > 0) {
    const stale = rejectionReasons.includes("stale_report");
    return {
      ok: false,
      generatedAt: scriptReport.generatedAt || now.toISOString(),
      ranAt: scriptReport.ranAt || now.toISOString(),
      baseUrl: scriptReport.baseUrl || expectedBaseUrl,
      gitSha: scriptReport.gitSha ?? null,
      checks: [
        {
          id: "script:evidence-rejected",
          label: "Актуальность analytics-readiness",
          status: "fail",
          message: `Отчёт не относится к текущему деплою: ${rejectionReasons.join(", ")}`,
          category: "code",
        },
      ],
      summary: { ok: 0, warn: 0, fail: 1, skip: 0 },
      runbook: scriptReport.runbook ?? "docs/i2-analytics-gsc-runbook.md",
      source: stale ? "stale" : "invalid",
    };
  }

  return {
    ...scriptReport,
    source: "script",
  };
}

export function getAnalyticsReadinessReportPath(): string {
  return SCRIPT_REPORT_FILE;
}
