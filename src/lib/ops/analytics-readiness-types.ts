export type AnalyticsReadinessCheckStatus = "ok" | "warn" | "fail" | "skip";

export type AnalyticsReadinessCheckItem = {
  id: string;
  label: string;
  status: AnalyticsReadinessCheckStatus;
  message: string;
  category: "env" | "live" | "cms" | "manual" | "code";
};

export type AnalyticsReadinessScriptReport = {
  ok: boolean;
  ranAt: string;
  baseUrl: string;
  checks: AnalyticsReadinessCheckItem[];
  summary: { ok: number; warn: number; fail: number; skip: number };
  runbook?: string;
  gtmEventsCount?: number;
  conversionsRecommended?: string[];
};

export type AnalyticsReadinessSnapshot = AnalyticsReadinessScriptReport & {
  source: "script" | "missing";
};
