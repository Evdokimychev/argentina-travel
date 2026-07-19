import "server-only";

import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Database, Json } from "@/types/database";

type FeatureFlagRow = Database["public"]["Tables"]["feature_flags"]["Row"];

export type FeatureFlagSnapshot = {
  key: string;
  enabled: boolean;
  rolloutPercent: number;
  metadata: Json;
};

const CACHE_TTL_MS = 30_000;
const FAILURE_BACKOFF_MS = 3_000;
const QUERY_TIMEOUT_MS = 1_000;

const flagCache = new Map<string, { at: number; row: FeatureFlagRow | null }>();
const flagInFlight = new Map<string, Promise<FeatureFlagRow | null>>();
const flagRetryAfter = new Map<string, number>();

function normalizeRolloutPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.trunc(value)));
}

function toSnapshot(row: FeatureFlagRow): FeatureFlagSnapshot {
  return {
    key: row.key,
    enabled: row.enabled === true,
    rolloutPercent: normalizeRolloutPercent(row.rollout_percent),
    metadata: row.metadata ?? {},
  };
}

async function loadFlagRow(flagKey: string): Promise<FeatureFlagRow | null> {
  const now = Date.now();
  const cached = flagCache.get(flagKey);
  if (cached && now - cached.at < CACHE_TTL_MS) {
    return cached.row;
  }
  if (now < (flagRetryAfter.get(flagKey) ?? 0)) return null;

  const existingRequest = flagInFlight.get(flagKey);
  if (existingRequest) return existingRequest;

  const request = (async (): Promise<FeatureFlagRow | null> => {
    try {
      const supabase = createSupabaseAdminClient();
      const { data, error } = await supabase
        .from("feature_flags")
        .select("key, enabled, rollout_percent, metadata")
        .eq("key", flagKey)
        .abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS))
        .retry(false)
        .maybeSingle();
      if (error) throw error;

      const row = data ?? null;
      flagCache.set(flagKey, { at: Date.now(), row });
      flagRetryAfter.delete(flagKey);
      return row;
    } catch {
      flagRetryAfter.set(flagKey, Date.now() + FAILURE_BACKOFF_MS);
      return null;
    }
  })();

  flagInFlight.set(flagKey, request);
  void request.finally(() => {
    if (flagInFlight.get(flagKey) === request) flagInFlight.delete(flagKey);
  });
  return request;
}

export async function getFeatureFlagSnapshot(flagKey: string): Promise<FeatureFlagSnapshot | null> {
  const normalizedKey = flagKey.trim();
  if (!normalizedKey || !isSupabaseConfigured()) {
    return null;
  }
  const row = await loadFlagRow(normalizedKey);
  return row ? toSnapshot(row) : null;
}

export function getStableFlagBucket(flagKey: string, userId: string): number {
  const digest = createHash("sha256")
    .update(`${flagKey}:${userId}`, "utf8")
    .digest("hex");
  const bucketSource = Number.parseInt(digest.slice(0, 8), 16);
  if (Number.isNaN(bucketSource)) return 0;
  return bucketSource % 100;
}

function evaluateFlag(snapshot: FeatureFlagSnapshot, userId?: string | null): boolean {
  if (!snapshot.enabled) return false;
  if (snapshot.rolloutPercent >= 100) return true;
  if (snapshot.rolloutPercent <= 0) return false;
  if (!userId) return false;
  return getStableFlagBucket(snapshot.key, userId) < snapshot.rolloutPercent;
}

/** Server-side feature flag evaluation with deterministic rollout bucket. */
export async function getFlag(flagKey: string, userId?: string | null): Promise<boolean> {
  const snapshot = await getFeatureFlagSnapshot(flagKey);
  if (!snapshot) return false;
  return evaluateFlag(snapshot, userId);
}

export function invalidateFeatureFlagsCache(flagKey?: string): void {
  if (!flagKey) {
    flagCache.clear();
    flagInFlight.clear();
    flagRetryAfter.clear();
    return;
  }
  const normalizedKey = flagKey.trim();
  flagCache.delete(normalizedKey);
  flagInFlight.delete(normalizedKey);
  flagRetryAfter.delete(normalizedKey);
}
