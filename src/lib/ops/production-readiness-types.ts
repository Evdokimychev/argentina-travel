export type ReadinessCheckStatus = "ok" | "warn" | "fail" | "skip";

export type ReadinessCheckItem = {
  id: string;
  label: string;
  status: ReadinessCheckStatus;
  message: string;
  category: "env" | "database" | "security" | "build" | "smoke";
};

export type ProductionReadinessScriptReport = {
  ok: boolean;
  ranAt: string;
  gitSha: string | null;
  checks: ReadinessCheckItem[];
  summary: { ok: number; warn: number; fail: number; skip: number };
};

export type ProductionReadinessSnapshot = {
  ok: boolean;
  ranAt: string;
  source: "inline" | "script" | "merged";
  environment: {
    nodeEnv: string;
    deployEnv: string;
  };
  checks: ReadinessCheckItem[];
  summary: { ok: number; warn: number; fail: number; skip: number };
  scriptReport: ProductionReadinessScriptReport | null;
};
