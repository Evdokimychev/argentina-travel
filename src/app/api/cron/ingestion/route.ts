import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { logCronResult } from "@/lib/cron/log-cron-result";
import { enqueueIngestionRun, processIngestionRun } from "@/lib/ingestion/pipeline-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 300;
const ROUTE = "/api/cron/ingestion";
async function run(request: Request) {
  const auth = authorizeCronRequest(request); if (!auth.ok) return auth.response;
  const started = Date.now(); const ranAt = new Date().toISOString(); const db = createSupabaseAdminClient();
  const stuckBefore = new Date(Date.now() - 15 * 60_000).toISOString();
  const { data: stuck } = await db.from("ingestion_source_runs").select("id").in("status", ["pending", "fetching", "fetched", "normalizing", "processing", "publishing"]).lt("heartbeat_at", stuckBefore).limit(20);
  if (stuck?.length) await db.from("ingestion_source_runs").update({ status: "failed", error_category: "stuck_job", error_message: "Heartbeat expired", completed_at: ranAt, next_retry_at: ranAt }).in("id", stuck.map((run) => run.id));
  const { data: retries } = await db.from("ingestion_source_runs").select("id,source_id").eq("status", "failed").is("dead_lettered_at", null).not("next_retry_at", "is", null).lte("next_retry_at", ranAt).order("next_retry_at").limit(2);
  const { data: sources, error } = await db.from("ingestion_sources").select("id").eq("enabled", true).eq("status", "active").not("next_run_at", "is", null).lte("next_run_at", ranAt).order("priority", { ascending: false }).limit(3);
  if (error) return NextResponse.json({ ok: false, error: "Не удалось получить расписание" }, { status: 503 });
  const results = [];
  for (const retry of retries ?? []) {
    try { const queued = await enqueueIngestionRun(db, retry.source_id, { triggerKind: "retry", actorId: null, retryOfRunId: retry.id }); results.push(queued.existing ? queued : await processIngestionRun(db, queued.runId)); }
    catch (runError) { results.push({ sourceId: retry.source_id, status: "failed", error: runError instanceof Error ? runError.message : "UNKNOWN" }); }
  }
  for (const source of (sources ?? []).slice(0, Math.max(0, 3 - results.length))) {
    try { const queued = await enqueueIngestionRun(db, source.id, { triggerKind: "cron", actorId: null, idempotencyKey: `${source.id}:cron:${ranAt.slice(0, 16)}` }); results.push(queued.existing ? queued : await processIngestionRun(db, queued.runId)); }
    catch (runError) { results.push({ sourceId: source.id, status: "failed", error: runError instanceof Error ? runError.message : "UNKNOWN" }); }
  }
  const ok = results.every((result) => !("status" in result) || result.status !== "failed");
  await logCronResult(ROUTE, { ok, ranAt, message: `Ingestion processed ${results.length} due sources`, statusCode: ok ? 200 : 207, durationMs: Date.now() - started, details: { due: sources?.length ?? 0, results: results.length } });
  return NextResponse.json({ ok, results }, { status: ok ? 200 : 207 });
}
export const GET = run; export const POST = run;
