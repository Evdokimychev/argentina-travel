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

const flagCache = new Map<string, { at: number; row: FeatureFlagRow | null }>();

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

  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("feature_flags")
      .select("key, enabled, rollout_percent, metadata")
      .eq("key", flagKey)
      .maybeSingle();
    flagCache.set(flagKey, { at: now, row: data ?? null });
    return data ?? null;
  } catch {
    return null;
  }
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
    return;
  }
  flagCache.delete(flagKey.trim());
}
