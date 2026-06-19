import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { PublicApiKeyUsageStats } from "@/types/public-api";

const USAGE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const TOP_ENDPOINTS_LIMIT = 5;

export function publicApiUsageSinceIso(): string {
  return new Date(Date.now() - USAGE_WINDOW_MS).toISOString();
}

export async function logPublicApiKeyUsage(input: {
  keyId: string;
  endpoint: string;
  status: number;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const endpoint = input.endpoint.trim().slice(0, 512);
  if (!endpoint) return;

  const supabase = createSupabaseAdminClient();
  void supabase.from("api_key_usage_log").insert({
    key_id: input.keyId,
    endpoint,
    status: input.status,
  });
}

export async function fetchApiKeyUsageStats(
  keyIds: readonly string[]
): Promise<Map<string, PublicApiKeyUsageStats>> {
  const result = new Map<string, PublicApiKeyUsageStats>();
  if (!keyIds.length || !isSupabaseConfigured()) return result;

  for (const id of keyIds) {
    result.set(id, { requestsLast7d: 0, topEndpoints: [] });
  }

  const since = publicApiUsageSinceIso();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("api_key_usage_log")
    .select("key_id, endpoint")
    .in("key_id", [...keyIds])
    .gte("ts", since);

  if (error || !data) return result;

  const endpointCounts = new Map<string, Map<string, number>>();

  for (const row of data) {
    const keyId = row.key_id as string;
    const endpoint = row.endpoint as string;
    const stats = result.get(keyId);
    if (!stats) continue;

    stats.requestsLast7d += 1;

    let perKey = endpointCounts.get(keyId);
    if (!perKey) {
      perKey = new Map();
      endpointCounts.set(keyId, perKey);
    }
    perKey.set(endpoint, (perKey.get(endpoint) ?? 0) + 1);
  }

  for (const [keyId, counts] of endpointCounts) {
    const stats = result.get(keyId);
    if (!stats) continue;

    stats.topEndpoints = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_ENDPOINTS_LIMIT)
      .map(([endpoint, count]) => ({ endpoint, count }));
  }

  return result;
}

export function attachUsageStats<T extends { id: string }>(
  keys: T[],
  stats: Map<string, PublicApiKeyUsageStats>
): Array<T & { usage: PublicApiKeyUsageStats }> {
  return keys.map((key) => ({
    ...key,
    usage: stats.get(key.id) ?? { requestsLast7d: 0, topEndpoints: [] },
  }));
}
