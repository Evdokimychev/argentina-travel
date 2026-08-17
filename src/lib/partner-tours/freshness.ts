/**
 * Partner feed freshness semantics for marketplace catalog claims.
 *
 * TTL aligns with typical sync cadence (affiliate-sync / partner cron ≈ hourly–daily).
 * Freshness affects availability claims — not necessarily hard deletion of the entity.
 */

export type FeedFreshness = "fresh" | "warning" | "stale" | "critical" | "unknown";

export type FeedFreshnessInput = {
  syncedAt?: string | null;
  /** Override clocks in tests. */
  now?: Date;
  /** Hours since sync before "warning". Default 36h (covers daily sync + slack). */
  warningAfterHours?: number;
  /** Hours before "stale" — stop claiming live availability. Default 72h. */
  staleAfterHours?: number;
  /** Hours before "critical" — quarantine/reject active bookable claims. Default 168h (7d). */
  criticalAfterHours?: number;
};

const HOUR_MS = 60 * 60 * 1000;

export function classifyFeedFreshness(input: FeedFreshnessInput): FeedFreshness {
  const syncedAt = input.syncedAt?.trim();
  if (!syncedAt) return "unknown";

  const syncedMs = Date.parse(syncedAt);
  if (!Number.isFinite(syncedMs)) return "unknown";

  const nowMs = (input.now ?? new Date()).getTime();
  const ageHours = (nowMs - syncedMs) / HOUR_MS;
  if (ageHours < 0) return "fresh";

  const warningAfter = input.warningAfterHours ?? 36;
  const staleAfter = input.staleAfterHours ?? 72;
  const criticalAfter = input.criticalAfterHours ?? 168;

  if (ageHours >= criticalAfter) return "critical";
  if (ageHours >= staleAfter) return "stale";
  if (ageHours >= warningAfter) return "warning";
  return "fresh";
}

export function freshnessAllowsAvailabilityClaims(freshness: FeedFreshness): boolean {
  return freshness === "fresh" || freshness === "warning" || freshness === "unknown";
}
