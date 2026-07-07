import type { SocialFeedLayout } from "@/lib/social-feed/types";

/** Источник Instagram в конфиге (редактируется в админке). */
export type SocialFeedSourceConfig = {
  id: string;
  handle: string;
  label: string;
  profileUrl: string;
  enabled: boolean;
  type: "instagram";
};

/** Курируемый пост — ручная публикация для ленты. */
export type SocialFeedPostConfig = {
  id: string;
  sourceId: string;
  mediaAssetId?: string;
  imageUrl?: string;
  caption?: string;
  permalink: string;
  publishedAt?: string;
  enabled: boolean;
};

/** Размещение ленты на странице сайта. */
export type SocialFeedPlacementConfig = {
  /** home | about | destination:ba | place:bariloche | kb:slug | itinerary:slug */
  id: string;
  label: string;
  sourceIds: string[];
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  layout?: SocialFeedLayout;
  limit?: number;
  minItems?: number;
  enabled?: boolean;
};

/** Полный конфиг социальной ленты (site_settings → site.social_feed). */
export type SocialFeedConfig = {
  version: number;
  updatedAt?: string;
  sources: SocialFeedSourceConfig[];
  posts: SocialFeedPostConfig[];
  placements: SocialFeedPlacementConfig[];
};
