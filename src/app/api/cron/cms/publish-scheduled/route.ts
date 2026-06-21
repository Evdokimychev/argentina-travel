import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { logCronResult } from "@/lib/cron/log-cron-result";
import { publishDueScheduledCmsDocuments } from "@/lib/cms/content-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CRON_ROUTE = "/api/cron/cms/publish-scheduled";

export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;

  const startedAt = Date.now();
  const ranAt = new Date().toISOString();

  try {
    const supabase = createSupabaseAdminClient();
    const result = await publishDueScheduledCmsDocuments(supabase, null);
    const ok = result.failed.length === 0;
    const message =
      result.publishedIds.length > 0
        ? `Published ${result.publishedIds.length} scheduled CMS document(s)`
        : "No scheduled CMS documents due";

    await logCronResult(CRON_ROUTE, {
      ok,
      ranAt,
      message,
      statusCode: ok ? 200 : 500,
      durationMs: Date.now() - startedAt,
      details: {
        publishedCount: result.publishedIds.length,
        failedCount: result.failed.length,
      },
    });

    return NextResponse.json(
      { ok, ranAt, publishedIds: result.publishedIds, failed: result.failed },
      { status: ok ? 200 : 500 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "CMS scheduled publish failed";
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

export async function POST(request: Request) {
  return GET(request);
}
