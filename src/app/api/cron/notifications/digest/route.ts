import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { logCronResult } from "@/lib/cron/log-cron-result";
import { sendDailyDigestEmail } from "@/lib/notifications/email-delivery";
import { fetchRecentDigestEvents } from "@/lib/notifications/notifications-server";
import { writeCronRunStatus } from "@/lib/ops/ops-status";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const CRON_ROUTE = "/api/cron/notifications/digest";

async function runDailyDigest(): Promise<NextResponse> {
  const ranAt = new Date().toISOString();

  if (!process.env.RESEND_API_KEY?.trim()) {
    const message = "RESEND_API_KEY не задан — рассылка сводки пропущена";
    console.log(`[cron:digest] ${message}`);
    writeCronRunStatus("digest", { ranAt, ok: true, message, details: { sent: false, skipped: true } });
    await logCronResult(CRON_ROUTE, {
      ok: true,
      ranAt,
      message,
      details: { sent: false, skipped: true },
    });
    return NextResponse.json({ ok: true, sent: false, skipped: true, message });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const sinceIso = new Date(Date.now() - ONE_DAY_MS).toISOString();
    const events = await fetchRecentDigestEvents(supabase, sinceIso, 100);

    const sent = await sendDailyDigestEmail({
      recipientEmail: process.env.LEADS_NOTIFY_EMAIL?.trim() ?? null,
      recipientName: "Администратор",
      events: events.map((event) => ({
        title: event.title,
        body: event.body,
        created_at: event.created_at,
        category: event.category,
      })),
      scopeLabel: "платформа",
    });

    const message = sent
      ? `Ежедневная сводка отправлена (${events.length} событий)`
      : `Сводка не отправлена: нет получателей или ошибка Resend (${events.length} событий)`;
    console.log(`[cron:digest] ${message}`);

    writeCronRunStatus("digest", {
      ranAt,
      ok: sent,
      message,
      details: { sent, eventsCount: events.length },
    });
    await logCronResult(CRON_ROUTE, {
      ok: sent,
      ranAt,
      message,
      details: { sent, eventsCount: events.length },
      statusCode: sent ? 200 : 500,
    });

    return NextResponse.json({ ok: true, sent, eventsCount: events.length, message });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error(`[cron:digest] Ошибка: ${message}`);
    writeCronRunStatus("digest", { ranAt, ok: false, message });
    await logCronResult(CRON_ROUTE, {
      ok: false,
      ranAt,
      message,
      error,
      statusCode: 500,
    });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;
  return runDailyDigest();
}

/** Vercel Cron вызывает маршруты через GET — делегируем в ту же логику. */
export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;
  return runDailyDigest();
}
