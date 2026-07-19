import type { Database, Json } from "@/types/database";
import type { IngestionConnectionConfig, IngestionSourceRecord } from "@/types/ingestion";

type Row = Database["public"]["Tables"]["ingestion_sources"]["Row"];

function objectValue(value: Json): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function rowToIngestionSource(row: Row): IngestionSourceRecord {
  const retry = objectValue(row.retry_policy);
  return {
    id: row.id, legacyKey: row.legacy_key, name: row.name, sourceType: row.source_type as IngestionSourceRecord["sourceType"],
    status: row.status as IngestionSourceRecord["status"], description: row.description, language: row.language,
    region: row.region, categories: row.categories, connectionConfig: objectValue(row.connection_config) as IngestionConnectionConfig,
    credentialRef: row.credential_ref, scheduleKind: row.schedule_kind as IngestionSourceRecord["scheduleKind"],
    scheduleExpression: row.schedule_expression, enabled: row.enabled, priority: row.priority, trustLevel: row.trust_level,
    legalNotes: row.legal_notes, rateLimitPerMinute: row.rate_limit_per_minute,
    retryPolicy: { maxAttempts: Number(retry.maxAttempts ?? 3), baseDelaySeconds: Number(retry.baseDelaySeconds ?? 60), maxDelaySeconds: Number(retry.maxDelaySeconds ?? 3600) },
    timeoutSeconds: row.timeout_seconds, checkpoint: objectValue(row.checkpoint), ownerUserId: row.owner_user_id,
    lastRunAt: row.last_run_at, lastSuccessAt: row.last_success_at, nextRunAt: row.next_run_at,
    lastError: row.last_error, lastTestedAt: row.last_tested_at, lastTestOk: row.last_test_ok,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export function sourceInputToRow(input: Partial<IngestionSourceRecord>) {
  return {
    ...(input.legacyKey === undefined ? {} : { legacy_key: input.legacyKey }),
    ...(input.name === undefined ? {} : { name: input.name.trim() }),
    ...(input.sourceType === undefined ? {} : { source_type: input.sourceType }),
    ...(input.status === undefined ? {} : { status: input.status }),
    ...(input.description === undefined ? {} : { description: input.description }),
    ...(input.language === undefined ? {} : { language: input.language }),
    ...(input.region === undefined ? {} : { region: input.region }),
    ...(input.categories === undefined ? {} : { categories: input.categories }),
    ...(input.connectionConfig === undefined ? {} : { connection_config: input.connectionConfig as Json }),
    ...(input.credentialRef === undefined ? {} : { credential_ref: input.credentialRef }),
    ...(input.scheduleKind === undefined ? {} : { schedule_kind: input.scheduleKind }),
    ...(input.scheduleExpression === undefined ? {} : { schedule_expression: input.scheduleExpression }),
    ...(input.enabled === undefined ? {} : { enabled: input.enabled }),
    ...(input.priority === undefined ? {} : { priority: input.priority }),
    ...(input.trustLevel === undefined ? {} : { trust_level: input.trustLevel }),
    ...(input.legalNotes === undefined ? {} : { legal_notes: input.legalNotes }),
    ...(input.rateLimitPerMinute === undefined ? {} : { rate_limit_per_minute: input.rateLimitPerMinute }),
    ...(input.retryPolicy === undefined ? {} : { retry_policy: input.retryPolicy as Json }),
    ...(input.timeoutSeconds === undefined ? {} : { timeout_seconds: input.timeoutSeconds }),
    ...(input.checkpoint === undefined ? {} : { checkpoint: input.checkpoint as Json }),
  };
}
