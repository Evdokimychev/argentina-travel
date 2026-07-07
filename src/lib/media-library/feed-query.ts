/**
 * Запрос «живых лент» из единой медиатеки (manifest.json).
 * Instagram, Wikimedia, туры — один scoring, одни привязки.
 */
import manifestData from "@/data/media-library/manifest.json";
import { mediaUrl } from "@/lib/media/media-cdn";
import {
  resolveSocialFeedTopics,
} from "@/lib/social-feed/resolve-context";
import type { SocialFeedContext, SocialFeedTopic } from "@/lib/social-feed/types";
import type { MediaAsset } from "@/types/media-asset";

const manifest = manifestData as { version: number; assets: MediaAsset[] };

const FEED_ROLES = new Set(["hero", "gallery", "section", "card", "background", "content"]);

export type MediaFeedItem = {
  id: string;
  assetId: string;
  sourceId: string;
  mediaType: "image" | "video" | "carousel";
  thumbnailUrl: string;
  mediaUrl: string;
  permalink?: string;
  caption?: string;
  authorHandle?: string;
  topics: string[];
  publishedAt?: string;
  syncedAt: string;
  fromInstagram: boolean;
};

export type MediaFeedResult = {
  items: MediaFeedItem[];
  topics: SocialFeedTopic[];
  usedManifestFallback: boolean;
};

function assetToFeedItem(asset: MediaAsset, topics: string[]): MediaFeedItem {
  const isIg = asset.source === "instagram" || Boolean(asset.instagramPermalink);
  return {
    id: asset.id,
    assetId: asset.id,
    sourceId: asset.instagramHandle === "iv.evd" ? "iv-evd" : asset.source,
    mediaType: asset.mediaKind === "video" ? "video" : "image",
    thumbnailUrl: mediaUrl(asset.localPath),
    mediaUrl: mediaUrl(asset.localPath),
    permalink: asset.instagramPermalink ?? asset.sourceUrl,
    caption: asset.caption ?? asset.title,
    authorHandle: asset.instagramHandle ?? asset.author,
    topics,
    publishedAt: asset.publishedAt,
    syncedAt: asset.publishedAt ?? new Date(0).toISOString(),
    fromInstagram: isIg,
  };
}

function tagSet(values: string[]): Set<string> {
  return new Set(values.map((v) => v.toLowerCase()));
}

function assetMatchesContext(
  asset: MediaAsset,
  context: SocialFeedContext,
  topicIds: Set<string>,
  tagTopics: Map<string, string[]>
): boolean {
  if (!FEED_ROLES.has(asset.role) && asset.role !== "thumbnail") return false;
  if (asset.role === "logo") return false;

  if (context.kbArticleId && asset.kbArticleId === context.kbArticleId) return true;
  if (context.placeSlug && asset.placeId === context.placeSlug) return true;
  if (context.destinationId && asset.destinationId === context.destinationId) return true;
  if (context.citySlug && asset.placeId === context.citySlug) return true;
  if (context.guideTopicId && asset.guideTopicId === context.guideTopicId) return true;
  if (context.itinerarySlug && asset.tags.includes(context.itinerarySlug)) return true;

  const assetTags = tagSet(asset.tags);
  for (const topicId of topicIds) {
    if (assetTags.has(topicId)) return true;
    const bindings = tagTopics.get(topicId) ?? [];
    if (bindings.some((b) => assetTags.has(b))) return true;
  }

  if (context.kbTags?.length) {
    const kb = tagSet(context.kbTags);
    if ([...kb].some((t) => assetTags.has(t))) return true;
  }

  if (context.topics?.length) {
    const explicit = tagSet(context.topics);
    if ([...explicit].some((t) => assetTags.has(t))) return true;
  }

  if (context.preset?.startsWith("primary")) {
    if (asset.source === "instagram" && asset.instagramHandle === "iv.evd") return true;
    if (assetTags.has("author") || assetTags.has("iv-evd")) return true;
  }

  return false;
}

function scoreAsset(
  asset: MediaAsset,
  topicIds: Set<string>,
  context: SocialFeedContext
): number {
  let score = 0;
  const tags = tagSet(asset.tags);

  if (asset.source === "instagram") score += 80;
  if (asset.instagramHandle === "iv.evd") score += 40;
  if (context.preset?.startsWith("primary") && asset.instagramHandle === "iv.evd") score += 50;

  for (const t of topicIds) {
    if (tags.has(t)) score += 30;
  }

  if (context.destinationId && asset.destinationId === context.destinationId) score += 25;
  if (context.placeSlug && asset.placeId === context.placeSlug) score += 25;
  if (context.kbArticleId && asset.kbArticleId === context.kbArticleId) score += 35;

  score += Math.max(0, 20 - (asset.feedPriority ?? 10));
  if (asset.publishedAt) score += new Date(asset.publishedAt).getTime() / 1e12;

  return score;
}

function inferTopicsForAsset(asset: MediaAsset, topicIds: Set<string>): string[] {
  const out = new Set<string>();
  for (const t of topicIds) {
    if (asset.tags.includes(t)) out.add(t);
    if (asset.destinationId) out.add(asset.destinationId);
    if (asset.placeId) out.add(asset.placeId);
  }
  if (out.size === 0 && asset.tags.length) {
    asset.tags.slice(0, 3).forEach((t) => out.add(t));
  }
  return [...out];
}

export function queryMediaFeed(
  context: SocialFeedContext,
  limit = 12
): MediaFeedResult {
  const topics = resolveSocialFeedTopics(context);
  const topicIds = new Set(topics.map((t) => t.id));
  const tagTopics = new Map(
    topics.map((t) => [t.id, [...(t.kbTags ?? []), ...(t.hashtags ?? []), t.id]])
  );

  let candidates = manifest.assets.filter((asset) =>
    assetMatchesContext(asset, context, topicIds, tagTopics)
  );

  if (context.preset?.startsWith("primary") && candidates.length === 0) {
    candidates = manifest.assets.filter(
      (a) =>
        FEED_ROLES.has(a.role) &&
        (a.source === "instagram" || a.instagramHandle === "iv.evd" || a.tags.includes("author"))
    );
  }

  const scored = candidates
    .map((asset) => ({
      asset,
      score: scoreAsset(asset, topicIds, context),
    }))
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const items: MediaFeedItem[] = [];

  for (const { asset } of scored) {
    const url = mediaUrl(asset.localPath);
    if (seen.has(url)) continue;
    seen.add(url);
    items.push(assetToFeedItem(asset, inferTopicsForAsset(asset, topicIds)));
    if (items.length >= limit) break;
  }

  return {
    items,
    topics,
    usedManifestFallback: items.length > 0 && !items.some((i) => i.fromInstagram),
  };
}

export function countMediaFeed(context: SocialFeedContext): number {
  return queryMediaFeed(context, 100).items.length;
}
