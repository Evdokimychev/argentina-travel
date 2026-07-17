import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest } from "@/lib/admin/audit";
import {
  INTEGRATION_VERIFICATION_IDS,
  verifyIntegrationConnection,
} from "@/lib/integrations/verification-server";
import type { IntegrationVerificationResult, IntegrationVerificationStatus } from "@/lib/integrations/verification-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const recentChecks = new Map<string, number>();
const CHECK_COOLDOWN_MS = 15_000;
const ALLOWED_IDS = new Set<string>(INTEGRATION_VERIFICATION_IDS);

const PERSISTED_SUMMARIES: Record<IntegrationVerificationStatus, string> = {
  verified: "Последняя безопасная проверка соединения прошла успешно.",
  failed: "Последняя проверка не подтвердила соединение.",
  manual_required: "Автоматической проверки недостаточно — нужен контрольный сценарий владельца.",
  not_configured: "На момент последней проверки подключение ещё не было настроено.",
};

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;
  const { data, error } = await createSupabaseAdminClient()
    .from("admin_audit_log")
    .select("entity_id, payload, created_at")
    .eq("action", "integration.verify")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: "Не удалось загрузить историю проверок." }, { status: 503 });
  const checks: Record<string, IntegrationVerificationResult> = {};
  for (const row of data ?? []) {
    const id = row.entity_id ?? "";
    if (!ALLOWED_IDS.has(id) || checks[id]) continue;
    const payload = row.payload && typeof row.payload === "object" && !Array.isArray(row.payload) ? row.payload : {};
    const status = typeof payload.status === "string" && ["verified", "failed", "manual_required", "not_configured"].includes(payload.status)
      ? payload.status as IntegrationVerificationStatus
      : "failed";
    checks[id] = {
      id: id as IntegrationVerificationResult["id"],
      status,
      checkedAt: row.created_at,
      latencyMs: typeof payload.latencyMs === "number" ? payload.latencyMs : 0,
      summary: PERSISTED_SUMMARIES[status],
    };
  }
  return NextResponse.json({ checks }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;
  if (auth.via !== "session") return NextResponse.json({ error: "Проверка подключения требует личную сессию." }, { status: 403 });

  if (Number(request.headers.get("content-length") ?? 0) > 4_096) {
    return NextResponse.json({ error: "Запрос слишком большой" }, { status: 413 });
  }

  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  const id = body?.id?.trim() ?? "";
  if (!ALLOWED_IDS.has(id)) {
    return NextResponse.json({ error: "Неизвестная интеграция" }, { status: 400 });
  }
  const key = `${auth.actorId}:${id}`;
  const lastCheckAt = recentChecks.get(key) ?? 0;
  if (Date.now() - lastCheckAt < CHECK_COOLDOWN_MS) {
    return NextResponse.json(
      { error: "Подождите несколько секунд перед повторной проверкой" },
      { status: 429, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  recentChecks.set(key, Date.now());

  try {
    const result = await verifyIntegrationConnection(id);
    const { error: auditError } = await createSupabaseAdminClient().from("admin_audit_log").insert({
      actor_user_id: auth.actorId,
      action: "integration.verify",
      entity_type: "integration",
      entity_id: result.id,
      payload: { status: result.status, latencyMs: result.latencyMs },
      ip_address: clientIpFromRequest(request),
    });
    if (auditError) return NextResponse.json({ error: "Проверка выполнена, но результат не удалось сохранить. Повторите позже." }, { status: 503 });
    return NextResponse.json(
      { result },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNKNOWN_INTEGRATION") {
      return NextResponse.json({ error: "Неизвестная интеграция" }, { status: 400 });
    }
    return NextResponse.json({ error: "Проверка временно недоступна" }, { status: 500 });
  }
}
