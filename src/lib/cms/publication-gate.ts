import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";

type DbClient = SupabaseClient<Database>;

export type CmsPublicationGateResult = {
  ok: boolean;
  errors: string[];
  sourceCount: number;
  claimCount: number;
  invalidMediaCount: number;
};

const ERROR_LABELS: Record<string, string> = {
  document_not_found: "документ не найден",
  missing_title: "нет заголовка",
  missing_body: "нет основного текста",
  missing_active_source: "нет проверенного действующего источника",
  missing_fact_check_date: "не указана дата фактчекинга",
  review_due: "срок проверки истёк или не задан",
  workflow_not_ready: "редакционный этап не завершён",
  missing_reviewer: "не назначен проверяющий",
  missing_verified_claims: "нет проверенных утверждений",
  invalid_or_stale_claims: "есть непроверенные или просроченные утверждения",
  media_rights_incomplete: "не подтверждены права или атрибуция медиа",
};

function asRecord(value: Json): Record<string, Json | undefined> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value;
}

function asNumber(value: Json | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function parseCmsPublicationGate(value: Json): CmsPublicationGateResult {
  const record = asRecord(value);
  const errors = Array.isArray(record?.errors)
    ? record.errors.filter((error): error is string => typeof error === "string")
    : ["publication_gate_unavailable"];

  return {
    ok: record?.ok === true && errors.length === 0,
    errors,
    sourceCount: asNumber(record?.sourceCount),
    claimCount: asNumber(record?.claimCount),
    invalidMediaCount: asNumber(record?.invalidMediaCount),
  };
}

export async function checkCmsPublicationGate(
  supabase: DbClient,
  documentId: string
): Promise<CmsPublicationGateResult> {
  const { data, error } = await supabase.rpc("content_publication_gate", {
    p_document_id: documentId,
  });

  if (error || data == null) {
    return {
      ok: false,
      errors: ["publication_gate_unavailable"],
      sourceCount: 0,
      claimCount: 0,
      invalidMediaCount: 0,
    };
  }
  return parseCmsPublicationGate(data);
}

export function cmsPublicationGateMessage(result: CmsPublicationGateResult): string {
  return result.errors.map((code) => ERROR_LABELS[code] ?? code).join("; ");
}
