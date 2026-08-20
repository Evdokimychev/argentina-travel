import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { logCronResult } from "@/lib/cron/log-cron-result";

export const dynamic = "force-dynamic";
export const maxDuration = 120;
const CRON_ROUTE = "/api/cron/platform-maintenance";
const DEFAULT_SUBTASK_TIMEOUT_MS = 12_000;

type Subtask = {
  key: string;
  path: string;
  /** When false, failure does not fail the whole orchestrator. Default true for critical housekeeping. */
  critical?: boolean;
  timeoutMs?: number;
  when?: (now: Date) => boolean;
};

/**
 * Subtasks for the daily Hobby cron (vercel.json: `0 3 * * *` UTC).
 * Manual GET with CRON_SECRET still works anytime.
 * Do not document this orchestrator as hourly — Vercel Hobby is daily.
 *
 * Isolation contract:
 * - each subtask has its own timeout;
 * - non-JSON / thrown / timed-out subtasks are recorded without aborting siblings;
 * - only critical failures flip the orchestrator HTTP status to 500.
 */
const SUBTASKS: Subtask[] = [
  { key: "typing", path: "/api/cron/messaging/cleanup-typing", critical: false },
  { key: "privacyProcess", path: "/api/cron/privacy/process", critical: true, timeoutMs: 25_000 },
  { key: "expireUnpaidBookings", path: "/api/cron/bookings/expire-unpaid", critical: true },
  { key: "bookingReminder24h", path: "/api/cron/messaging/booking-reminder-24h", critical: true },
  { key: "tripPrepReminders", path: "/api/cron/trip-prep/reminders", critical: false },
  { key: "digest", path: "/api/cron/notifications/digest", critical: false },
  { key: "emailRetry", path: "/api/cron/notifications/email-retry", critical: false },
  { key: "contentFreshness", path: "/api/cron/content-freshness", critical: false },
  { key: "cmsPublishScheduled", path: "/api/cron/cms/publish-scheduled", critical: true },
  { key: "searchReindex", path: "/api/cron/search/reindex", critical: false, timeoutMs: 25_000 },
  {
    key: "backup",
    path: "/api/cron/ops/backup-hint",
    critical: false,
    when: (now) => now.getUTCDay() === 0,
  },
];

async function runSubtask(
  origin: string,
  headers: HeadersInit,
  task: Subtask,
): Promise<{ ok: boolean; critical: boolean; result: Record<string, unknown> }> {
  const critical = task.critical !== false;
  const timeoutMs = task.timeoutMs ?? DEFAULT_SUBTASK_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${origin}${task.path}`, {
      headers,
      signal: controller.signal,
    });
    const contentType = response.headers.get("content-type") ?? "";
    let body: unknown = null;
    if (contentType.includes("application/json")) {
      try {
        body = await response.json();
      } catch {
        body = { parseError: "invalid_json" };
      }
    } else {
      const text = await response.text();
      body = { nonJson: true, preview: text.slice(0, 200) };
    }

    return {
      ok: response.ok,
      critical,
      result: {
        status: response.status,
        ok: response.ok,
        body,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const timedOut = controller.signal.aborted || /aborted|AbortError/i.test(message);
    return {
      ok: false,
      critical,
      result: {
        ok: false,
        error: timedOut ? `timeout_after_${timeoutMs}ms` : message,
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;
  const startedAt = Date.now();

  const now = new Date();
  const ranAt = now.toISOString();

  try {
    const origin = new URL(request.url).origin;
    const cronSecret = process.env.CRON_SECRET?.trim();
    if (!cronSecret) {
      throw new Error("CRON_SECRET is not configured");
    }
    const headers: HeadersInit = { authorization: `Bearer ${cronSecret}` };
    const results: Record<string, unknown> = {};
    let criticalFailures = 0;
    let ran = 0;

    for (const task of SUBTASKS) {
      if (task.when && !task.when(now)) {
        results[task.key] = { skipped: true, reason: "schedule_gate" };
        continue;
      }

      ran += 1;
      const outcome = await runSubtask(origin, headers, task);
      results[task.key] = outcome.result;
      if (!outcome.ok && outcome.critical) criticalFailures += 1;
    }

    const ok = ran > 0 && criticalFailures === 0;
    await logCronResult(CRON_ROUTE, {
      ok,
      ranAt,
      message: ok
        ? "Platform maintenance completed"
        : `Platform maintenance critical failures: ${criticalFailures}`,
      statusCode: ok ? 200 : 500,
      durationMs: Date.now() - startedAt,
      details: {
        ran,
        criticalFailures,
      },
    });

    return NextResponse.json(
      { ok, ranAt, criticalFailures, results },
      { status: ok ? 200 : 500 },
    );
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
