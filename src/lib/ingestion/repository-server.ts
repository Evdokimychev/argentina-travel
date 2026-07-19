import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { IngestionOverview, IngestionSourceRecord } from "@/types/ingestion";
import { rowToIngestionSource, sourceInputToRow } from "@/lib/ingestion/source-mapper";
import { nextSourceRunAt } from "@/lib/ingestion/schedule";

type Db = SupabaseClient<Database>;

export async function listIngestionSources(db: Db): Promise<IngestionSourceRecord[]> {
  const { data, error } = await db.from("ingestion_sources").select("*").neq("status", "archived").order("priority", { ascending: false }).order("name");
  if (error) throw error;
  return (data ?? []).map(rowToIngestionSource);
}

export async function getIngestionSource(db: Db, id: string): Promise<IngestionSourceRecord | null> {
  const { data, error } = await db.from("ingestion_sources").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? rowToIngestionSource(data) : null;
}

export async function createIngestionSource(db: Db, input: Partial<IngestionSourceRecord> & Pick<IngestionSourceRecord, "name" | "sourceType">) {
  const temporary = { ...input, enabled: input.enabled ?? false, scheduleKind: input.scheduleKind ?? "manual", scheduleExpression: input.scheduleExpression ?? null };
  const nextRunAt = nextSourceRunAt(temporary as IngestionSourceRecord);
  const { data, error } = await db.from("ingestion_sources").insert({ ...sourceInputToRow(input), name: input.name.trim(), source_type: input.sourceType, next_run_at: nextRunAt }).select("*").single();
  if (error) throw error;
  return rowToIngestionSource(data);
}

export async function updateIngestionSource(db: Db, current: IngestionSourceRecord, patch: Partial<IngestionSourceRecord>) {
  const candidate = { ...current, ...patch };
  const { data, error } = await db.from("ingestion_sources").update({ ...sourceInputToRow(patch), next_run_at: nextSourceRunAt(candidate) }).eq("id", current.id).select("*").single();
  if (error) throw error;
  return rowToIngestionSource(data);
}

export async function getIngestionOverview(db: Db): Promise<IngestionOverview> {
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const stuckBefore = new Date(Date.now() - 15 * 60_000).toISOString();
  const [sources, runsToday, activeRuns, failedRuns, candidates, published, duplicates, heartbeat, recentRuns, stuckRuns] = await Promise.all([
    db.from("ingestion_sources").select("status,last_success_at,source_type,credential_ref"),
    db.from("ingestion_source_runs").select("id", { count: "exact", head: true }).gte("created_at", today.toISOString()),
    db.from("ingestion_source_runs").select("id", { count: "exact", head: true }).in("status", ["pending", "fetching", "fetched", "normalizing", "processing", "publishing"]),
    db.from("ingestion_source_runs").select("id", { count: "exact", head: true }).eq("status", "failed").gte("created_at", today.toISOString()),
    db.from("ingestion_candidates").select("id", { count: "exact", head: true }).eq("status", "awaiting_moderation"),
    db.from("ingestion_candidates").select("id", { count: "exact", head: true }).eq("status", "published"),
    db.from("ingestion_candidates").select("id", { count: "exact", head: true }).eq("status", "duplicate"),
    db.from("ingestion_source_runs").select("heartbeat_at").not("heartbeat_at", "is", null).order("heartbeat_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("ingestion_source_runs").select("started_at,completed_at").not("started_at", "is", null).not("completed_at", "is", null).order("completed_at", { ascending: false }).limit(100),
    db.from("ingestion_source_runs").select("id", { count: "exact", head: true }).in("status", ["fetching", "normalizing", "processing", "publishing"]).lt("heartbeat_at", stuckBefore),
  ]);
  const rows = sources.data ?? [];
  const durations = (recentRuns.data ?? []).map((run) => new Date(run.completed_at!).getTime() - new Date(run.started_at!).getTime()).filter((value) => Number.isFinite(value) && value >= 0);
  const lastHeartbeatAt = heartbeat.data?.heartbeat_at ?? null; const activeSources = rows.filter((row) => row.status === "active"); const telegramSources = activeSources.filter((row) => row.source_type === "telegram");
  const telegramConfigured = telegramSources.every((row) => Boolean(row.credential_ref && process.env[`${row.credential_ref}_API_ID`]?.trim() && process.env[`${row.credential_ref}_API_HASH`]?.trim() && process.env[`${row.credential_ref}_SESSION`]?.trim()));
  return { generatedAt: new Date().toISOString(), sources: { total: rows.length, active: activeSources.length, problematic: rows.filter((row) => ["degraded", "failed"].includes(row.status)).length, neverSucceeded: rows.filter((row) => !row.last_success_at).length }, runs: { today: runsToday.count ?? 0, running: activeRuns.count ?? 0, failed: failedRuns.count ?? 0, averageDurationMs: durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : null }, candidates: { awaitingModeration: candidates.count ?? 0, published: published.count ?? 0, duplicates: duplicates.count ?? 0 }, queueDepth: candidates.count ?? 0, lastHeartbeatAt, health: { database: true, scheduler: activeSources.length === 0 || Boolean(lastHeartbeatAt && Date.now() - new Date(lastHeartbeatAt).getTime() < 26 * 3_600_000), storage: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()), aiProvider: Boolean(process.env.OPENAI_API_KEY?.trim()), telegram: telegramConfigured, websites: !rows.some((row) => ["website", "rss", "sitemap", "json_api"].includes(row.source_type) && ["degraded", "failed"].includes(row.status)), stuckJobs: stuckRuns.count ?? 0 } };
}
