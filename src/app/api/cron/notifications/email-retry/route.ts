import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { logCronResult } from "@/lib/cron/log-cron-result";
import { processEmailOutboxRetries } from "@/lib/notifications/email-delivery";
import { fetchOutboxHealthSnapshot } from "@/lib/ops/outbox-health-server";

export const dynamic = "force-dynamic";
const CRON_ROUTE = "/api/cron/notifications/email-retry";

export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;

  const startedAt = Date.now();
  try {
    const result = await processEmailOutboxRetries();
    const outbox = await fetchOutboxHealthSnapshot();
    const ok = result.failed === 0 && outbox.ok;
    const statusCode = ok ? 200 : 500;
    await logCronResult(CRON_ROUTE, {
      ok,
      statusCode,
      durationMs: Date.now() - startedAt,
      message: ok ? "Очередь писем обработана" : "Часть писем осталась с ошибкой",
      details: { ...result, outbox },
    });
    return NextResponse.json({ ok, ...result, outbox }, { status: statusCode });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email retry failed";
    await logCronResult(CRON_ROUTE, {
      ok: false,
      statusCode: 500,
      durationMs: Date.now() - startedAt,
      message,
      error,
    });
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
