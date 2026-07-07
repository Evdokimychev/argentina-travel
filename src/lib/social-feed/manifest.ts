import { configSourceToRuntime } from "@/lib/social-feed/config-normalize";
import {
  invalidateSocialFeedConfigCache,
  loadSocialFeedConfigSync,
} from "@/lib/social-feed/config-seed";
import type { SocialFeedSource, SocialFeedTopic } from "@/lib/social-feed/types";

/** @deprecated Используйте loadSocialFeedConfig(). */
export function loadMediaSources(): SocialFeedSource[] {
  const config = loadSocialFeedConfigSync();
  return config.sources
    .filter((source) => source.enabled)
    .map((source, index) => configSourceToRuntime(source, index));
}

/** @deprecated Темы заменены placements. Возвращает пустой массив. */
export function loadTopicBindings(): SocialFeedTopic[] {
  return [];
}

export function resetSocialFeedConfigCache(): void {
  invalidateSocialFeedConfigCache();
}

/** @deprecated */
export function loadSocialFeedManifest() {
  const config = loadSocialFeedConfigSync();
  return {
    version: config.version,
    updatedAt: config.updatedAt ?? new Date().toISOString(),
    sources: loadMediaSources(),
    topics: [],
    items: [],
  };
}

export function getSocialFeedSourceById(id: string): SocialFeedSource | undefined {
  return loadMediaSources().find((s) => s.id === id);
}

/** @deprecated */
export function getSocialFeedTopicById(_id: string): SocialFeedTopic | undefined {
  return undefined;
}
