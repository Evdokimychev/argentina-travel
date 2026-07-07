import type {
  SocialFeedConfig,
  SocialFeedPlacementConfig,
  SocialFeedPostConfig,
  SocialFeedSourceConfig,
} from "@/types/social-feed-config";
import type { SocialFeedSource } from "@/lib/social-feed/types";

export const SOCIAL_FEED_SETTINGS_KEY = "site.social_feed";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeSource(raw: unknown): SocialFeedSourceConfig | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  const handle = typeof raw.handle === "string" ? raw.handle.trim() : "";
  const label = typeof raw.label === "string" ? raw.label.trim() : "";
  const profileUrl = typeof raw.profileUrl === "string" ? raw.profileUrl.trim() : "";
  if (!id || !handle || !label) return null;

  return {
    id,
    handle,
    label,
    profileUrl: profileUrl || `https://www.instagram.com/${handle.replace(/^@/, "")}/`,
    enabled: raw.enabled !== false,
    type: "instagram",
  };
}

function normalizePost(raw: unknown): SocialFeedPostConfig | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  const sourceId = typeof raw.sourceId === "string" ? raw.sourceId.trim() : "";
  const permalink = typeof raw.permalink === "string" ? raw.permalink.trim() : "";
  if (!id || !sourceId || !permalink) return null;

  return {
    id,
    sourceId,
    mediaAssetId: typeof raw.mediaAssetId === "string" ? raw.mediaAssetId.trim() : undefined,
    imageUrl: typeof raw.imageUrl === "string" ? raw.imageUrl.trim() : undefined,
    caption: typeof raw.caption === "string" ? raw.caption.trim() : undefined,
    permalink,
    publishedAt: typeof raw.publishedAt === "string" ? raw.publishedAt : undefined,
    enabled: raw.enabled !== false,
  };
}

function normalizePlacement(raw: unknown): SocialFeedPlacementConfig | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  const label = typeof raw.label === "string" ? raw.label.trim() : "";
  const sourceIds = Array.isArray(raw.sourceIds)
    ? raw.sourceIds.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    : [];
  if (!id || !label) return null;

  const layout =
    raw.layout === "carousel" || raw.layout === "grid" || raw.layout === "masonry"
      ? raw.layout
      : undefined;

  return {
    id,
    label,
    sourceIds,
    title: typeof raw.title === "string" ? raw.title : undefined,
    subtitle: typeof raw.subtitle === "string" ? raw.subtitle : undefined,
    eyebrow: typeof raw.eyebrow === "string" ? raw.eyebrow : undefined,
    layout,
    limit: typeof raw.limit === "number" ? raw.limit : undefined,
    minItems: typeof raw.minItems === "number" ? raw.minItems : undefined,
    enabled: raw.enabled !== false,
  };
}

export function normalizeSocialFeedConfig(raw: unknown): SocialFeedConfig {
  const record = isRecord(raw) ? raw : {};
  const sources = Array.isArray(record.sources)
    ? record.sources
        .map((item) => normalizeSource(item))
        .filter((item): item is SocialFeedSourceConfig => Boolean(item))
    : [];
  const posts = Array.isArray(record.posts)
    ? record.posts
        .map((item) => normalizePost(item))
        .filter((item): item is SocialFeedPostConfig => Boolean(item))
    : [];
  const placements = Array.isArray(record.placements)
    ? record.placements
        .map((item) => normalizePlacement(item))
        .filter((item): item is SocialFeedPlacementConfig => Boolean(item))
    : [];

  return {
    version: typeof record.version === "number" ? record.version : 1,
    updatedAt:
      typeof record.updatedAt === "string"
        ? record.updatedAt
        : new Date().toISOString(),
    sources,
    posts,
    placements,
  };
}

export function configSourceToRuntime(
  source: SocialFeedSourceConfig,
  index = 0,
): SocialFeedSource {
  return {
    id: source.id,
    type: source.type,
    handle: source.handle,
    label: source.label,
    profileUrl: source.profileUrl,
    role: source.id === "iv-evd" ? "primary" : "official",
    priority: index * 10,
  };
}

export function resolvePlacementConfig(
  config: SocialFeedConfig,
  placementId: string,
): SocialFeedPlacementConfig | null {
  const enabled = config.placements.filter((p) => p.enabled !== false);
  const exact = enabled.find((p) => p.id === placementId);
  if (exact) return exact;

  const [type] = placementId.split(":");
  if (type) {
    const typeDefault = enabled.find((p) => p.id === `${type}:default`);
    if (typeDefault) return typeDefault;
  }

  return enabled.find((p) => p.id === "home") ?? null;
}

export function resolveSourceIds(
  config: SocialFeedConfig,
  options: { placement?: string; sources?: string[] },
): { sourceIds: string[]; placement: SocialFeedPlacementConfig | null } {
  if (options.sources?.length) {
    return { sourceIds: options.sources, placement: null };
  }

  if (options.placement) {
    const placement = resolvePlacementConfig(config, options.placement);
    return { sourceIds: placement?.sourceIds ?? [], placement };
  }

  return { sourceIds: [], placement: null };
}
