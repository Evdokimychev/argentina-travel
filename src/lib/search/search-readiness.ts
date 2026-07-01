import { isMeilisearchConfigured } from "@/lib/search/meilisearch-client";

export type SearchReadinessCheck = {
  id: string;
  label: string;
  status: "ok" | "warn" | "fail" | "skip";
  message: string;
};

export type SearchReadinessReport = {
  ok: boolean;
  ranAt: string;
  configured: boolean;
  meiliHealthy: boolean | null;
  documentCount: number | null;
  checks: SearchReadinessCheck[];
};

const MEILI_ENV = ["MEILISEARCH_HOST", "MEILISEARCH_API_KEY"] as const;

function isProdLike(deployEnv: string | undefined, nodeEnv: string | undefined): boolean {
  return deployEnv === "production" || deployEnv === "staging" || nodeEnv === "production";
}

export async function pingMeilisearchHealth(): Promise<{ ok: boolean; message: string }> {
  if (!isMeilisearchConfigured()) {
    return { ok: false, message: "Meilisearch не настроен" };
  }

  const host = process.env.MEILISEARCH_HOST!.trim().replace(/\/$/, "");
  const apiKey = process.env.MEILISEARCH_API_KEY!.trim();

  try {
    const response = await fetch(`${host}/health`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      return { ok: false, message: `HTTP ${response.status}` };
    }
    const json = (await response.json()) as { status?: string };
    const status = json.status ?? "unknown";
    return { ok: status === "available", message: status };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Health ping failed";
    return { ok: false, message };
  }
}

export async function fetchMeilisearchDocumentCount(): Promise<number | null> {
  if (!isMeilisearchConfigured()) return null;

  const host = process.env.MEILISEARCH_HOST!.trim().replace(/\/$/, "");
  const apiKey = process.env.MEILISEARCH_API_KEY!.trim();

  try {
    const response = await fetch(`${host}/indexes/site/stats`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { numberOfDocuments?: number };
    return typeof json.numberOfDocuments === "number" ? json.numberOfDocuments : null;
  } catch {
    return null;
  }
}

export async function runSearchReadinessChecks(options?: {
  deployEnv?: string;
  nodeEnv?: string;
}): Promise<SearchReadinessReport> {
  const deployEnv = options?.deployEnv ?? process.env.DEPLOY_ENV?.trim();
  const nodeEnv = options?.nodeEnv ?? process.env.NODE_ENV;
  const prodLike = isProdLike(deployEnv, nodeEnv);
  const checks: SearchReadinessCheck[] = [];
  const configured = isMeilisearchConfigured();

  for (const key of MEILI_ENV) {
    const present = Boolean(process.env[key]?.trim());
    checks.push({
      id: `env:${key}`,
      label: key,
      status: present ? "ok" : prodLike ? "warn" : "skip",
      message: present ? "Задана" : prodLike ? "Не задана — поиск через Postgres/static" : "Не задана (локально OK)",
    });
  }

  let meiliHealthy: boolean | null = null;
  if (configured) {
    const health = await pingMeilisearchHealth();
    meiliHealthy = health.ok;
    checks.push({
      id: "meili:health",
      label: "Meilisearch /health",
      status: health.ok ? "ok" : "warn",
      message: health.message,
    });
  } else {
    checks.push({
      id: "meili:health",
      label: "Meilisearch /health",
      status: "skip",
      message: "Пропущено — MEILISEARCH_* не заданы",
    });
  }

  let documentCount: number | null = null;
  if (configured && meiliHealthy) {
    documentCount = await fetchMeilisearchDocumentCount();
    if (documentCount != null) {
      checks.push({
        id: "meili:documents",
        label: "Документов в индексе site",
        status: documentCount > 0 ? "ok" : "warn",
        message: documentCount > 0 ? `${documentCount} документов` : "Индекс пуст — запустите переиндексацию",
      });
    } else {
      checks.push({
        id: "meili:documents",
        label: "Документов в индексе site",
        status: "warn",
        message: "Не удалось получить stats",
      });
    }
  }

  const hasFail = checks.some((check) => check.status === "fail");
  const hasWarn = checks.some((check) => check.status === "warn");

  return {
    ok: !hasFail && (!prodLike || !hasWarn || configured),
    ranAt: new Date().toISOString(),
    configured,
    meiliHealthy,
    documentCount,
    checks,
  };
}
