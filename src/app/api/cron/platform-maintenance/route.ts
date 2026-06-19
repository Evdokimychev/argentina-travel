import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { logCronResult } from "@/lib/cron/log-cron-result";

export const dynamic = "force-dynamic";
export const maxDuration = 120;
const CRON_ROUTE = "/api/cron/platform-maintenance";

/**
 * Orchestrator for Hobby Vercel plans (2-cron limit): typing cleanup every tick;
 * booking reminders every hour; freshness report at 07:00 UTC;
 * digest at 08:00 UTC; backup hint on Sunday 03:00 UTC.
 * Individual routes remain for manual POST triggers.
 */
export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;
  const startedAt = Date.now();

  const now = new Date();
  const ranAt = now.toISOString();
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();
  const isSunday = now.getUTCDay() === 0;

  try {
    const origin = new URL(request.url).origin;
    const headers: HeadersInit = { "x-vercel-cron": "1" };
    const results: Record<string, unknown> = {};
    const checks: boolean[] = [];

    const typingRes = await fetch(`${origin}/api/cron/messaging/cleanup-typing`, { headers });
    results.typing = await typingRes.json();
    checks.push(typingRes.ok);

    const privacyRes = await fetch(`${origin}/api/cron/privacy/process`, { headers });
    results.privacyProcess = await privacyRes.json();
    checks.push(privacyRes.ok);

    if (hour === 8 && minute < 5) {
      const digestRes = await fetch(`${origin}/api/cron/notifications/digest`, { headers });
      results.digest = await digestRes.json();
      checks.push(digestRes.ok);
    }

    if (hour === 7 && minute < 5) {
      const freshnessRes = await fetch(`${origin}/api/cron/content-freshness`, { headers });
      results.contentFreshness = await freshnessRes.json();
      checks.push(freshnessRes.ok);
    }

    if (minute < 5) {
      const reminderRes = await fetch(
        `${origin}/api/cron/messaging/booking-reminder-24h`,
        { headers }
      );
      results.bookingReminder24h = await reminderRes.json();
      checks.push(reminderRes.ok);
    }

    if (isSunday && hour === 3 && minute < 5) {
      const backupRes = await fetch(`${origin}/api/cron/ops/backup-hint`, { headers });
      results.backup = await backupRes.json();
      checks.push(backupRes.ok);
    }

    const ok = checks.every(Boolean);
    await logCronResult(CRON_ROUTE, {
      ok,
      ranAt,
      message: ok ? "Platform maintenance completed" : "Platform maintenance has failed subtask",
      statusCode: ok ? 200 : 500,
      durationMs: Date.now() - startedAt,
      details: {
        checksCount: checks.length,
        successfulChecks: checks.filter(Boolean).length,
      },
    });

    return NextResponse.json({ ok, ranAt, results }, { status: ok ? 200 : 500 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Platform maintenance failed";
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
