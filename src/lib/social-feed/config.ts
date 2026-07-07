/** Client-safe re-exports (без node:fs и Supabase). */
export {
  SOCIAL_FEED_SETTINGS_KEY,
  normalizeSocialFeedConfig,
  configSourceToRuntime,
  resolvePlacementConfig,
  resolveSourceIds,
} from "@/lib/social-feed/config-normalize";

export {
  getDefaultSocialFeedConfig,
  loadSocialFeedConfigSync,
  invalidateSocialFeedConfigCache,
} from "@/lib/social-feed/config-seed";
