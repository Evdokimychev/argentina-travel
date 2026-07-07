/** Источник медиа в социальной ленте. */
export type SocialFeedSourceRole = "primary" | "official" | "curated";

export type SocialFeedSourceType =
  | "instagram"
  | "internal_gallery"
  | "media_library";

export type SocialFeedSource = {
  id: string;
  type: SocialFeedSourceType;
  handle: string;
  label: string;
  profileUrl: string;
  role: SocialFeedSourceRole;
  /** Меньше = выше в выдаче при равной релевантности. */
  priority: number;
};

export type SocialFeedMediaType = "image" | "video" | "carousel";

export type SocialFeedItem = {
  id: string;
  sourceId: string;
  externalId?: string;
  mediaType: SocialFeedMediaType;
  thumbnailUrl: string;
  mediaUrl?: string;
  permalink?: string;
  caption?: string;
  authorHandle?: string;
  topics: string[];
  width?: number;
  height?: number;
  publishedAt?: string;
  syncedAt: string;
};

export type SocialFeedTopic = {
  id: string;
  labelRu: string;
  hashtags?: string[];
  sourceIds?: string[];
  destinationIds?: string[];
  placeSlugs?: string[];
  kbTags?: string[];
  regionSlugs?: string[];
  citySlugs?: string[];
};

export type SocialFeedLayout = "carousel" | "grid" | "masonry";

export type SocialFeedContext = {
  /** Готовый пресет (главная лента @iv.evd). */
  preset?: "primary" | "primary-home" | "about";
  /** Явные topic id из taxonomy. */
  topics?: string[];
  destinationId?: string;
  placeSlug?: string;
  kbArticleId?: string;
  kbTags?: string[];
  regionSlug?: string;
  citySlug?: string;
  itinerarySlug?: string;
  guideTopicId?: string;
  /** Минимум карточек; иначе секция скрыта. */
  minItems?: number;
  /** Дополнить внутренней галереей туров, если Instagram пуст. */
  allowGalleryFallback?: boolean;
  /** Ограничить источники. */
  sourceRoles?: SocialFeedSourceRole[];
};

export type SocialFeedResult = {
  items: SocialFeedItem[];
  /** @deprecated Темы заменены placements */
  topics: SocialFeedTopic[];
  sources: SocialFeedSource[];
  primarySource: SocialFeedSource | null;
  /** @deprecated Галерея-fallback отключён */
  usedGalleryFallback: boolean;
  placement?: import("@/types/social-feed-config").SocialFeedPlacementConfig | null;
};

export type SocialFeedManifest = {
  version: number;
  updatedAt: string;
  sources: SocialFeedSource[];
  topics: SocialFeedTopic[];
  items: SocialFeedItem[];
};
