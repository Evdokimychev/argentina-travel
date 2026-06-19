import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { logCronResult } from "@/lib/cron/log-cron-result";
import { writeCronRunStatus } from "@/lib/ops/ops-status";
import { processApprovedPrivacyDeleteRequests } from "@/lib/privacy/delete-automation";

export const dynamic = "force-dynamic";
const CRON_ROUTE = "/api/cron/privacy/process";

async function runPrivacyProcessCron(limit: number): Promise<NextResponse> {
  const startedAt = Date.now();
  const ranAt = new Date().toISOString();

  try {
    const summary = await processApprovedPrivacyDeleteRequests(limit);
    const ok = summary.failed === 0;
    const message =
      summary.queued === 0
        ? "Нет подтверждённых GDPR-запросов"
        : `Обработано ${summary.completed} из ${summary.queued} запросов`;

    writeCronRunStatus("privacyProcess", {
      ranAt,
      ok,
      message,
      details: {
        queued: summary.queued,
        completed: summary.completed,
        failed: summary.failed,
      },
    });

    await logCronResult(CRON_ROUTE, {
      ok,
      ranAt,
      message,
      statusCode: ok ? 200 : 500,
      durationMs: Date.now() - startedAt,
      details: {
        queued: summary.queued,
        completed: summary.completed,
        failed: summary.failed,
        failedIds: summary.failedIds,
      },
    });

    return NextResponse.json(
      {
        ok,
        message,
        ...summary,
      },
      { status: ok ? 200 : 500 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    writeCronRunStatus("privacyProcess", {
      ranAt,
      ok: false,
      message,
    });
    await logCronResult(CRON_ROUTE, {
      ok: false,
      ranAt,
      message,
      statusCode: 500,
      durationMs: Date.now() - startedAt,
      error,
    });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

function readBatchLimit(request: Request): number {
  const raw = new URL(request.url).searchParams.get("limit");
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) return 20;
  return Math.max(1, Math.min(100, parsed));
}

export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;
  return runPrivacyProcessCron(readBatchLimit(request));
}

export async function POST(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;
  return runPrivacyProcessCron(readBatchLimit(request));
}
