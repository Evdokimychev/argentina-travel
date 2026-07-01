import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { logCronResult } from "@/lib/cron/log-cron-result";

export const dynamic = "force-dynamic";
export const maxDuration = 120;
const CRON_ROUTE = "/api/cron/platform-maintenance";

type Subtask = {
  key: string;
  path: string;
  when?: (now: Date) => boolean;
};

/** Subtasks for the daily Hobby cron (vercel.json: once per day). Manual POST still works anytime. */
const SUBTASKS: Subtask[] = [
  { key: "typing", path: "/api/cron/messaging/cleanup-typing" },
  { key: "privacyProcess", path: "/api/cron/privacy/process" },
  { key: "bookingReminder24h", path: "/api/cron/messaging/booking-reminder-24h" },
  { key: "tripPrepReminders", path: "/api/cron/trip-prep/reminders" },
  { key: "digest", path: "/api/cron/notifications/digest" },
  { key: "contentFreshness", path: "/api/cron/content-freshness" },
  { key: "cmsPublishScheduled", path: "/api/cron/cms/publish-scheduled" },
  { key: "searchReindex", path: "/api/cron/search/reindex" },
  {
    key: "backup",
    path: "/api/cron/ops/backup-hint",
    when: (now) => now.getUTCDay() === 0,
  },
];

export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;
  const startedAt = Date.now();

  const now = new Date();
  const ranAt = now.toISOString();

  try {
    const origin = new URL(request.url).origin;
    const headers: HeadersInit = { "x-vercel-cron": "1" };
    const results: Record<string, unknown> = {};
    const checks: boolean[] = [];

    for (const task of SUBTASKS) {
      if (task.when && !task.when(now)) continue;

      const response = await fetch(`${origin}${task.path}`, { headers });
      results[task.key] = await response.json();
      checks.push(response.ok);
    }

    const ok = checks.length > 0 && checks.every(Boolean);
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
