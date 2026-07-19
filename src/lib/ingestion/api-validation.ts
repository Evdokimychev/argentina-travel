import type { IngestionSourceRecord } from "@/types/ingestion";

const secretPattern = /(secret|token|password|api[_-]?key|api[_-]?hash|session|authorization|cookie)/i;

export function assertSecretFreeConfig(value: unknown, path = "connectionConfig"): void {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (secretPattern.test(key)) throw new Error(`Секретное поле ${path}.${key} должно храниться в окружении`);
    assertSecretFreeConfig(child, `${path}.${key}`);
  }
}

export function sourcePatchFromBody(body: Record<string, unknown>): Partial<IngestionSourceRecord> {
  const allowed = ["legacyKey", "name", "sourceType", "status", "description", "language", "region", "categories", "connectionConfig", "credentialRef", "scheduleKind", "scheduleExpression", "enabled", "priority", "trustLevel", "legalNotes", "rateLimitPerMinute", "retryPolicy", "timeoutSeconds"] as const;
  const patch: Partial<IngestionSourceRecord> = {};
  for (const key of allowed) if (key in body) Object.assign(patch, { [key]: body[key] });
  if (patch.connectionConfig) assertSecretFreeConfig(patch.connectionConfig);
  if (patch.credentialRef !== undefined && patch.credentialRef !== null && !/^[A-Z][A-Z0-9_]{2,80}$/.test(patch.credentialRef)) throw new Error("Некорректная ссылка на секрет окружения");
  return patch;
}
