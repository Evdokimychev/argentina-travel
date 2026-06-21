export type MediaCategory =
  | "destination"
  | "city"
  | "province"
  | "national-park"
  | "attraction"
  | "glacier"
  | "waterfall"
  | "mountain"
  | "trekking"
  | "winery"
  | "wildlife"
  | "transport"
  | "immigration"
  | "banking"
  | "mobile-operators"
  | "accommodation"
  | "travel-guide"
  | "itinerary"
  | "collection"
  | "blog-article";

export type MediaSource =
  | "wikimedia"
  | "wikipedia"
  | "openstreetmap"
  | "unsplash"
  | "pexels"
  | "local";

export type MediaAssetRole =
  | "hero"
  | "gallery"
  | "section"
  | "content"
  | "card"
  | "background"
  | "logo"
  | "thumbnail";

export interface MediaAsset {
  id: string;
  title: string;
  alt: string;
  caption?: string;
  source: MediaSource;
  sourceUrl: string;
  license: string;
  author?: string;
  authorProfileUrl?: string;
  attributionHtml?: string;
  imageTitle?: string;
  imageDescription?: string;
  /** Whether attribution caption must be shown (Unsplash/Pexels). */
  attributionRequired?: boolean;
  /** Manual pin — skip auto-replacement in warm-image-cache. */
  pinned?: boolean;
  category: MediaCategory;
  tags: string[];
  localPath: string;
  placeId?: string;
  articleId?: string;
  collectionId?: string;
  destinationId?: string;
  blogCategory?: string;
  guideTopicId?: string;
  guidePageSlug?: string;
  tourSlug?: string;
  climateKey?: string;
  immigrationTopicId?: string;
  servicePageId?: string;
  podborRegionId?: string;
  podborThemeId?: string;
  shopProductId?: string;
  blogPostSlug?: string;
  /** MD5 hex digest of local file bytes — used to dedupe visually identical gallery slots. */
  contentHash?: string;
  role: MediaAssetRole;
}

export interface MediaManifest {
  version: number;
  assets: MediaAsset[];
}
