import { configSourceToRuntime, resolveSourceIds } from "@/lib/social-feed/config-normalize";
import { loadSocialFeedConfigSync } from "@/lib/social-feed/config-seed";
import { loadSocialFeedConfig } from "@/lib/social-feed/config-server";
import { ManualCuratedProvider } from "@/lib/social-feed/providers/manual-curated";
import type { SocialFeedLayout } from "@/lib/social-feed/types";
import type { SocialFeedPlacementConfig } from "@/types/social-feed-config";
import type { SocialFeedItem, SocialFeedResult, SocialFeedSource } from "@/lib/social-feed/types";

const DEFAULT_LIMIT = 12;

export type GetSocialFeedOptions = {
  placement?: string;
  sources?: string[];
  limit?: number;
  minItems?: number;
};

export type SocialFeedResolvedDisplay = {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  layout?: SocialFeedLayout;
  limit?: number;
  minItems?: number;
};

function buildResult(
  items: SocialFeedItem[],
  sources: SocialFeedSource[],
  placement: SocialFeedPlacementConfig | null,
): SocialFeedResult {
  const primarySource =
    sources.find((s) => s.role === "primary") ?? sources[0] ?? null;

  return {
    items,
    sources,
    primarySource,
    placement,
    topics: [],
    usedGalleryFallback: false,
  };
}

function fetchFromConfig(
  config: Awaited<ReturnType<typeof loadSocialFeedConfig>>,
  options: GetSocialFeedOptions,
): SocialFeedResult {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const { sourceIds, placement } = resolveSourceIds(config, options);

  if (!sourceIds.length) {
    return buildResult([], [], placement);
  }

  const provider = new ManualCuratedProvider(config);
  const items = provider.getItems({ sourceIds, limit });

  const sources = config.sources
    .filter((source) => source.enabled && sourceIds.includes(source.id))
    .map((source, index) => configSourceToRuntime(source, index));

  return buildResult(items, sources, placement);
}

export async function getSocialFeed(
  options: GetSocialFeedOptions = {},
): Promise<SocialFeedResult> {
  const config = await loadSocialFeedConfig();
  return fetchFromConfig(config, options);
}

/** Синхронная версия для тестов (seed JSON). */
export function getSocialFeedSync(options: GetSocialFeedOptions = {}): SocialFeedResult {
  const config = loadSocialFeedConfigSync();
  return fetchFromConfig(config, options);
}

export function resolveSocialFeedDisplay(
  options: GetSocialFeedOptions & {
    title?: string;
    subtitle?: string;
    eyebrow?: string;
    layout?: SocialFeedLayout;
  },
  result: SocialFeedResult,
): SocialFeedResolvedDisplay {
  const placement = result.placement;

  return {
    title: options.title ?? placement?.title,
    subtitle: options.subtitle ?? placement?.subtitle,
    eyebrow: options.eyebrow ?? placement?.eyebrow,
    layout: options.layout ?? placement?.layout ?? "carousel",
    limit: options.limit ?? placement?.limit ?? DEFAULT_LIMIT,
    minItems: options.minItems ?? placement?.minItems ?? 3,
  };
}

export async function getPrimaryInstagramProfileUrl(): Promise<string> {
  const config = await loadSocialFeedConfig();
  const primary =
    config.sources.find((s) => s.id === "iv-evd" && s.enabled) ??
    config.sources.find((s) => s.enabled);
  return primary?.profileUrl ?? "https://www.instagram.com/iv.evd/";
}

export function getPrimaryInstagramProfileUrlSync(): string {
  const config = loadSocialFeedConfigSync();
  const primary =
    config.sources.find((s) => s.id === "iv-evd" && s.enabled) ??
    config.sources.find((s) => s.enabled);
  return primary?.profileUrl ?? "https://www.instagram.com/iv.evd/";
}
