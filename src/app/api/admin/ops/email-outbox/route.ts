import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { processEmailOutboxIds, processEmailOutboxRetries } from "@/lib/notifications/email-delivery";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_STATUSES = new Set(["pending", "sending", "delivered", "failed", "dead"]);

function safeDeliveryFailure(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value.toLowerCase();
  if (/auth|credential|unauthor|forbidden|api.?key/.test(normalized)) return "Провайдер отклонил доступ. Проверьте подключение в настройках.";
  if (/rate.?limit|too many|quota/.test(normalized)) return "Провайдер временно ограничил отправку.";
  if (/recipient|address|mailbox|invalid email/.test(normalized)) return "Адрес получателя отклонён почтовой службой.";
  if (/timeout|network|connect|temporar/.test(normalized)) return "Временный сбой связи с почтовой службой.";
  return "Доставка не подтверждена. Повторите отправку или проверьте подключение.";
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "operations.email");
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const status = url.searchParams.get("status")?.trim() ?? "";
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit")) || 50));
  const supabase = createSupabaseAdminClient();
  // Service-role table is intentionally projected without recipients or message bodies.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("email_delivery_outbox")
    .select("id, subject, status, attempts, next_attempt_at, last_attempt_at, delivered_at, last_error, created_at, updated_at, recipients")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (status && ALLOWED_STATUSES.has(status)) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Не удалось прочитать очередь писем" }, { status: 500 });
  const items = (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id,
    subject: typeof row.subject === "string" ? row.subject : "Без темы",
    status: row.status,
    attempts: row.attempts,
    nextAttemptAt: row.next_attempt_at,
    lastAttemptAt: row.last_attempt_at,
    deliveredAt: row.delivered_at,
    lastError: safeDeliveryFailure(row.last_error),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    recipientCount: Array.isArray(row.recipients) ? row.recipients.length : 0,
  }));
  return NextResponse.json({ items, generatedAt: new Date().toISOString() });
}

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "operations.email");
  if (!auth.ok) return auth.response;
  if (auth.via !== "session") return NextResponse.json({ error: "Повторная отправка требует личную сессию." }, { status: 403 });
  const body = (await request.json().catch(() => null)) as { action?: string; ids?: string[]; confirm?: boolean } | null;
  if (body?.confirm !== true) return NextResponse.json({ error: "Подтвердите повторную отправку писем." }, { status: 409 });
  const action = body?.action;
  const ids = [...new Set(body?.ids ?? [])].filter((id) => UUID.test(id)).slice(0, 50);
  const supabase = createSupabaseAdminClient();
  let result: { queued: number; delivered: number; failed: number };

  if (action === "retry_due") {
    result = await processEmailOutboxRetries(50);
  } else if (action === "retry_selected" && ids.length) {
    result = await processEmailOutboxIds(ids);
  } else if (action === "requeue_dead" && ids.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("email_delivery_outbox")
      .update({ status: "failed", attempts: 0, next_attempt_at: new Date().toISOString(), last_error: "Requeued by administrator" })
      .in("id", ids)
      .eq("status", "dead")
      .select("id");
    if (error) return NextResponse.json({ error: "Не удалось вернуть письма в очередь" }, { status: 500 });
    result = await processEmailOutboxIds((data ?? []).map((row: { id: string }) => row.id));
  } else {
    return NextResponse.json({ error: "Недопустимое действие или пустой выбор" }, { status: 400 });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: `email_outbox.${action}`,
    entityType: "email_delivery_outbox",
    payload: { selectedCount: ids.length, ...result },
    ipAddress: clientIpFromRequest(request),
  });
  return NextResponse.json({ ok: true, result });
}
