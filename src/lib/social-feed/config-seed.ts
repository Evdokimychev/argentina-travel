import seedConfig from "@/data/social-feed/config.json";
import { normalizeSocialFeedConfig } from "@/lib/social-feed/config-normalize";
import type { SocialFeedConfig } from "@/types/social-feed-config";

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
}

export function invalidateSocialFeedConfigCache(): void {
  cachedConfig = null;
  cacheAt = 0;
}

export function getDefaultSocialFeedConfig(): SocialFeedConfig {
  return normalizeSocialFeedConfig(seedConfig);
}

/** Синхронная загрузка seed-конфига (тесты, fallback без Supabase). */
export function loadSocialFeedConfigSync(): SocialFeedConfig {
  const cached = readCache();
  if (cached) return cached;
  const config = getDefaultSocialFeedConfig();
  writeCache(config);
  return config;
}
