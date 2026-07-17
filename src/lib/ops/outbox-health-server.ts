import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type OutboxHealthMetrics = {
  pending: number;
  failed: number;
  dead: number;
  staleSending: number;
  oldestQueuedAt: string | null;
  providerConfigured: boolean;
};

export type OutboxHealthSnapshot = OutboxHealthMetrics & {
  ok: boolean;
  status: "ok" | "degraded" | "critical";
  oldestQueuedAgeMinutes: number | null;
  reasons: string[];
  generatedAt: string;
};

const PENDING_WARNING_COUNT = 50;
const OLDEST_QUEUE_WARNING_MINUTES = 15;

export function evaluateOutboxHealth(
  metrics: OutboxHealthMetrics,
  now = new Date(),
): OutboxHealthSnapshot {
  const oldestQueuedAgeMinutes = metrics.oldestQueuedAt
    ? Math.max(0, Math.round((now.getTime() - new Date(metrics.oldestQueuedAt).getTime()) / 60_000))
    : null;
  const criticalReasons: string[] = [];
  const warningReasons: string[] = [];

  if (!metrics.providerConfigured) criticalReasons.push("email_provider_not_configured");
  if (metrics.dead > 0) criticalReasons.push("dead_letters_present");
  if (metrics.staleSending > 0) criticalReasons.push("stale_sending_lease");
  if (metrics.failed > 0) warningReasons.push("failed_retries_present");
  if (metrics.pending >= PENDING_WARNING_COUNT) warningReasons.push("pending_queue_high");
  if (
    oldestQueuedAgeMinutes != null &&
    oldestQueuedAgeMinutes >= OLDEST_QUEUE_WARNING_MINUTES
  ) {
    warningReasons.push("oldest_queue_item_stale");
  }

  const reasons = [...criticalReasons, ...warningReasons];
  const status = criticalReasons.length > 0
    ? "critical"
    : warningReasons.length > 0
      ? "degraded"
      : "ok";

  return {
    ...metrics,
    ok: status === "ok",
    status,
    oldestQueuedAgeMinutes,
    reasons,
    generatedAt: now.toISOString(),
  };
}

export async function fetchOutboxHealthSnapshot(): Promise<OutboxHealthSnapshot> {
  const supabase = createSupabaseAdminClient();
  // Generated database types are updated only after the migration set is frozen.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = (supabase as any).from("email_delivery_outbox");
  const staleBefore = new Date(Date.now() - 15 * 60_000).toISOString();

  const [pendingResult, failedResult, deadResult, staleResult, oldestResult] = await Promise.all([
    table.select("id", { count: "exact", head: true }).eq("status", "pending"),
    table.select("id", { count: "exact", head: true }).eq("status", "failed"),
    table.select("id", { count: "exact", head: true }).eq("status", "dead"),
    table
      .select("id", { count: "exact", head: true })
      .eq("status", "sending")
      .lt("updated_at", staleBefore),
    table
      .select("created_at")
      .in("status", ["pending", "failed"])
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const firstError = [pendingResult, failedResult, deadResult, staleResult, oldestResult]
    .map((result) => result.error)
    .find(Boolean);
  if (firstError) {
    throw new Error(firstError.message ?? "Не удалось проверить очередь писем");
  }

  return evaluateOutboxHealth({
    pending: pendingResult.count ?? 0,
    failed: failedResult.count ?? 0,
    dead: deadResult.count ?? 0,
    staleSending: staleResult.count ?? 0,
    oldestQueuedAt: oldestResult.data?.created_at ?? null,
    providerConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
  });
}
