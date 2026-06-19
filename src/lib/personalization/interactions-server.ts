import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  InteractionAction,
  InteractionBatchItem,
  InteractionEntityType,
  UserInteractionRow,
} from "@/types/user-interactions";

const RECENT_DAYS = 90;
const RECENT_LIMIT = 50;

export type InteractionActor = {
  userId?: string | null;
  anonymousId?: string | null;
};

function getClient() {
  if (!isSupabaseConfigured()) return null;
  try {
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
}

export async function insertInteractionBatch(input: {
  actor: InteractionActor;
  interactions: InteractionBatchItem[];
}): Promise<number> {
  const supabase = getClient();
  if (!supabase || !input.interactions.length) return 0;

  const userId = input.actor.userId?.trim() || null;
  const anonymousId = userId ? null : input.actor.anonymousId?.trim() || null;
  if (!userId && !anonymousId) return 0;

  const rows = input.interactions.map((item) => ({
    user_id: userId,
    anonymous_id: anonymousId,
    entity_type: item.entityType,
    entity_id: item.entityId,
    action: item.action,
    ts: item.ts ?? new Date().toISOString(),
  }));

  const { error } = await supabase.from("user_interactions").insert(rows);
  if (error) return 0;
  return rows.length;
}

export async function fetchRecentInteractions(
  actor: InteractionActor,
  entityType?: InteractionEntityType,
  limit = RECENT_LIMIT
): Promise<UserInteractionRow[]> {
  const supabase = getClient();
  if (!supabase) return [];

  const userId = actor.userId?.trim();
  const anonymousId = actor.anonymousId?.trim();
  if (!userId && !anonymousId) return [];

  const since = new Date();
  since.setDate(since.getDate() - RECENT_DAYS);

  let query = supabase
    .from("user_interactions")
    .select("id, user_id, anonymous_id, entity_type, entity_id, action, ts")
    .gte("ts", since.toISOString())
    .order("ts", { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq("user_id", userId);
  } else if (anonymousId) {
    query = query.eq("anonymous_id", anonymousId);
  }

  if (entityType) {
    query = query.eq("entity_type", entityType);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as UserInteractionRow[];
}

export function rankInteractionIds(
  rows: UserInteractionRow[],
  action?: InteractionAction
): string[] {
  const filtered = action ? rows.filter((row) => row.action === action) : rows;
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const row of filtered) {
    if (seen.has(row.entity_id)) continue;
    seen.add(row.entity_id);
    ordered.push(row.entity_id);
  }

  return ordered;
}
