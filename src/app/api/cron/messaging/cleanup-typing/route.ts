import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { logCronResult } from "@/lib/cron/log-cron-result";
import { writeCronRunStatus } from "@/lib/ops/ops-status";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const TYPING_TTL_MINUTES = 15;
const CRON_ROUTE = "/api/cron/messaging/cleanup-typing";

async function cleanupTypingPresence(): Promise<NextResponse> {
  const ranAt = new Date().toISOString();
  const cutoffIso = new Date(Date.now() - TYPING_TTL_MINUTES * 60 * 1000).toISOString();

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("typing_presence")
      .delete()
      .lt("updated_at", cutoffIso)
      .select("thread_id");

    if (error) {
      const message = `Ошибка очистки typing_presence: ${error.message}`;
      console.error(`[cron:cleanup-typing] ${message}`);
      writeCronRunStatus("cleanupTyping", { ranAt, ok: false, message });
      await logCronResult(CRON_ROUTE, {
        ok: false,
        ranAt,
        message,
        details: { cutoffIso },
        statusCode: 500,
      });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const deletedCount = data?.length ?? 0;
    const message = `Удалено устаревших записей typing_presence: ${deletedCount} (старше ${TYPING_TTL_MINUTES} мин)`;
    console.log(`[cron:cleanup-typing] ${message}`);

    writeCronRunStatus("cleanupTyping", {
      ranAt,
      ok: true,
      message,
      details: { deletedCount, cutoffIso },
    });
    await logCronResult(CRON_ROUTE, {
      ok: true,
      ranAt,
      message,
      details: { deletedCount, cutoffIso },
      statusCode: 200,
    });

    return NextResponse.json({ ok: true, deletedCount, cutoffIso, message });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error(`[cron:cleanup-typing] Ошибка: ${message}`);
    writeCronRunStatus("cleanupTyping", { ranAt, ok: false, message });
    await logCronResult(CRON_ROUTE, {
      ok: false,
      ranAt,
      message,
      error,
      details: { cutoffIso },
      statusCode: 500,
    });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;
  return cleanupTypingPresence();
}

/** Vercel Cron вызывает маршруты через GET — делегируем в ту же логику. */
export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;
  return cleanupTypingPresence();
}
