import "server-only";

import fs from "node:fs";
import path from "node:path";
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
  if (!scriptReport) {
    return {
      ok: false,
      ranAt: new Date().toISOString(),
      baseUrl: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://www.goargentina.ru",
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

  return {
    ...scriptReport,
    source: "script",
  };
}

export function getAnalyticsReadinessReportPath(): string {
  return SCRIPT_REPORT_FILE;
}
