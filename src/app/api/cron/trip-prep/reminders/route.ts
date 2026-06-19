import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { logCronResult } from "@/lib/cron/log-cron-result";
import { runTripPrepRemindersCron } from "@/lib/notifications/trip-prep-notify";

export const dynamic = "force-dynamic";

const CRON_ROUTE = "/api/cron/trip-prep/reminders";

async function handleCron() {
  const startedAt = Date.now();
  const ranAt = new Date().toISOString();

  try {
    const result = await runTripPrepRemindersCron();
    const message = `Trip prep reminders: processed ${result.processed}, sent ${result.sent}`;

    await logCronResult(CRON_ROUTE, {
      ok: true,
      ranAt,
      message,
      statusCode: 200,
      durationMs: Date.now() - startedAt,
      details: result,
    });

    return NextResponse.json({ ok: true, ranAt, ...result, message });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Trip prep reminders cron failed";
    await logCronResult(CRON_ROUTE, {
      ok: false,
      ranAt,
      message,
      error,
      statusCode: 500,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json({ ok: false, error: message, ranAt }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;
  return handleCron();
}

export async function POST(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;
  return handleCron();
}
