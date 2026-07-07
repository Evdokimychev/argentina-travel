import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";
import type { SocialFeedConfig } from "@/types/social-feed-config";
import {
  SOCIAL_FEED_SETTINGS_KEY,
  normalizeSocialFeedConfig,
} from "@/lib/social-feed/config-normalize";
import {
  getDefaultSocialFeedConfig,
  invalidateSocialFeedConfigCache,
  loadSocialFeedConfigSync,
} from "@/lib/social-feed/config-seed";

const CACHE_TTL_MS = 60_000;
let cachedConfig: SocialFeedConfig | null = null;
let cacheAt = 0;

function readCache(): SocialFeedConfig | null {
  if (!cachedConfig) return null;
  if (Date.now() - cacheAt >= CACHE_TTL_MS) return null;
  return cachedConfig;
}

function writeCache(config: SocialFeedConfig): void {
  cachedConfig = config;
  cacheAt = Date.now();
  invalidateSocialFeedConfigCache();
}

async function loadSettingsKey(key: string): Promise<Json | undefined> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    return data?.value;
  } catch {
    return undefined;
  }
}

/** Загрузка конфига: Supabase site.social_feed → seed JSON. */
export async function loadSocialFeedConfig(): Promise<SocialFeedConfig> {
  const cached = readCache();
  if (cached) return cached;

  const stored = await loadSettingsKey(SOCIAL_FEED_SETTINGS_KEY);
  const config = stored
    ? normalizeSocialFeedConfig(stored)
    : getDefaultSocialFeedConfig();

  writeCache(config);
  return config;
}

export async function saveSocialFeedConfig(
  config: SocialFeedConfig,
  actorUserId?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createSupabaseAdminClient();
    const payload = {
      ...config,
      updatedAt: new Date().toISOString(),
    } satisfies SocialFeedConfig;

    const { error } = await supabase.from("site_settings").upsert(
      {
        key: SOCIAL_FEED_SETTINGS_KEY,
        value: payload as unknown as Json,
        updated_by: actorUserId ?? null,
      },
      { onConflict: "key" },
    );

    if (error) return { ok: false, error: error.message };

    cachedConfig = null;
    cacheAt = 0;
    invalidateSocialFeedConfigCache();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Не удалось сохранить конфиг",
    };
  }
}

/** Сброс server-кэша после сохранения (для тестов). */
export function resetSocialFeedServerConfigCache(): void {
  cachedConfig = null;
  cacheAt = 0;
  loadSocialFeedConfigSync();
}
