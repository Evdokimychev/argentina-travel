import { mediaUrl } from "@/lib/media/media-cdn";
import { getMediaAsset } from "@/lib/media-resolver";
import type { SocialFeedConfig, SocialFeedPostConfig } from "@/types/social-feed-config";
import type { SocialFeedItem } from "@/lib/social-feed/types";
import type {
  SocialFeedDataProvider,
  SocialFeedProviderRequest,
} from "@/lib/social-feed/providers/types";

const FALLBACK_IMAGE = "/logo-light.svg";

function resolvePostImageUrl(post: SocialFeedPostConfig): string {
  if (post.mediaAssetId) {
    const asset = getMediaAsset(post.mediaAssetId);
    if (asset) return mediaUrl(asset.localPath);
  }
  if (post.imageUrl) return post.imageUrl;
  return FALLBACK_IMAGE;
}

function postToItem(
  post: SocialFeedPostConfig,
  sourceHandle: string | undefined,
  syncedAt: string,
): SocialFeedItem {
  return {
    id: post.id,
    sourceId: post.sourceId,
    mediaType: "image",
    thumbnailUrl: resolvePostImageUrl(post),
    mediaUrl: resolvePostImageUrl(post),
    permalink: post.permalink,
    caption: post.caption,
    authorHandle: sourceHandle,
    topics: [],
    publishedAt: post.publishedAt,
    syncedAt,
  };
}

export class ManualCuratedProvider implements SocialFeedDataProvider {
  constructor(private readonly config: SocialFeedConfig) {}

  getItems({ sourceIds, limit }: SocialFeedProviderRequest): SocialFeedItem[] {
    const allowed = new Set(sourceIds);
    const sourcesById = new Map(
      this.config.sources.filter((s) => s.enabled).map((s) => [s.id, s]),
    );
    const syncedAt = this.config.updatedAt ?? new Date().toISOString();

    return this.config.posts
      .filter((post) => post.enabled && allowed.has(post.sourceId) && sourcesById.has(post.sourceId))
      .sort((a, b) => {
        const aTime = a.publishedAt ? Date.parse(a.publishedAt) : 0;
        const bTime = b.publishedAt ? Date.parse(b.publishedAt) : 0;
        return bTime - aTime;
      })
      .slice(0, limit)
      .map((post) => postToItem(post, sourcesById.get(post.sourceId)?.handle, syncedAt));
  }
}
