import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { logCronResult } from "@/lib/cron/log-cron-result";
import { reindexSearchDocuments } from "@/lib/search/search-indexer";
import { writeSearchReindexStatus } from "@/lib/search/search-reindex-status";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const CRON_ROUTE = "/api/cron/search/reindex";

export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;

  const startedAt = Date.now();
  const ranAt = new Date().toISOString();

  try {
    const supabase = createSupabaseAdminClient();
    const result = await reindexSearchDocuments(supabase);
    writeSearchReindexStatus(result, "cron");

    const message = result.ok
      ? `Поиск переиндексирован: ${result.indexed} док., удалено ${result.removed}`
      : result.error ?? "Ошибка переиндексации поиска";

    await logCronResult(CRON_ROUTE, {
      ok: result.ok,
      ranAt,
      message,
      statusCode: result.ok ? 200 : 500,
      durationMs: Date.now() - startedAt,
      details: {
        indexed: result.indexed,
        removed: result.removed,
        meilisearch: result.meilisearch,
        error: result.error,
      },
    });

    return NextResponse.json(
      {
        ok: result.ok,
        ranAt,
        indexed: result.indexed,
        removed: result.removed,
        meilisearch: result.meilisearch,
        error: result.error,
      },
      { status: result.ok ? 200 : 500 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search reindex cron failed";
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
