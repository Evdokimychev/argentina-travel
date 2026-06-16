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

export type MediaSource = "wikimedia" | "wikipedia" | "openstreetmap" | "unsplash" | "local";

export type MediaAssetRole = "hero" | "gallery" | "logo" | "thumbnail";

export interface MediaAsset {
  id: string;
  title: string;
  alt: string;
  caption?: string;
  source: MediaSource;
  sourceUrl: string;
  license: string;
  author?: string;
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
  role: MediaAssetRole;
}

export interface MediaManifest {
  version: number;
  assets: MediaAsset[];
}
