export type ImageRole = "hero" | "gallery" | "content" | "section" | "card" | "background";

export type ImageSourceKind = "unsplash" | "pexels" | "wikimedia" | "local";

export interface ImageAttribution {
  authorName: string;
  authorProfileUrl?: string;
  sourceUrl: string;
  source?: ImageSourceKind;
  license: string;
}

export interface ImageQuery {
  query: string;
  role: ImageRole;
  alt: string;
  title?: string;
  description?: string;
  fallbackIds?: string[];
  localPath?: string;
  /** Commons-specific search query (defaults to query). */
  wikimediaQuery?: string;
  /** Prefer Wikimedia after Pexels for parks, wildlife, landmarks. */
  preferWikimedia?: boolean;
}

/** Resolved image with schema.org ImageObject-friendly fields. */
export interface ResolvedImage {
  src: string;
  width?: number;
  height?: number;
  alt: string;
  title: string;
  description?: string;
  attribution: ImageAttribution;
  attributionHtml?: string;
  localPath?: string;
}

export { ROLE_WIDTHS, ROLE_SIZES, widthForRole, sizesForRole } from "./sizes";

export const CACHE_VERSION = 1;

/** Normalize legacy `section` role to `content`. */
export function normalizeImageRole(role: ImageRole): ImageRole {
  return role === "section" ? "content" : role;
}
