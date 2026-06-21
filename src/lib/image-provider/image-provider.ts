import type { StockCacheFile } from "./cache";
import type { ImageQuery, ImageRole, ResolvedImage } from "./types";
import { ROLE_SIZES } from "./sizes";
import {
  fallbackResolvedImage,
  resolveFromManifestBinding,
  mediaAssetToResolved,
  getAllManifestAssets,
} from "./local-fallback";
import {
  getPageEntry,
  getAllPageEntries,
  resolveRoleQuery,
  type PageRegistryEntry,
} from "./page-registry";

import stockCacheData from "@/data/media-library/stock-cache.json";

function cacheKey(query: ImageQuery): string {
  return `${query.role}:${query.query}`;
}

function fromCache(query: ImageQuery): ResolvedImage | null {
  const cache = stockCacheData as StockCacheFile;
  if (!cache?.entries) return null;
  const entry = cache.entries[cacheKey(query)];
  return entry?.resolved ?? null;
}

function resolveForEntry(
  entry: PageRegistryEntry,
  role: ImageRole,
  sectionId?: string,
): ResolvedImage {
  const manifestResolved = resolveFromManifestBinding(entry.binding, role, entry.label);
  if (manifestResolved) return manifestResolved;

  const query = resolveRoleQuery(entry, role, sectionId);
  if (query) {
    const cached = fromCache(query);
    if (cached) return cached;
  }

  return fallbackResolvedImage(entry.label);
}

export interface ResolvePageImagesOptions {
  galleryCount?: number;
  sectionIds?: string[];
}

export interface PageImages {
  hero: ResolvedImage;
  gallery: ResolvedImage[];
  sections: Record<string, ResolvedImage>;
  card?: ResolvedImage;
}

export function resolvePageImages(
  pageId: string,
  options: ResolvePageImagesOptions = {},
): PageImages {
  const entry = getPageEntry(pageId);
  if (!entry) {
    const fallback = fallbackResolvedImage(pageId);
    return { hero: fallback, gallery: [], sections: {} };
  }

  const galleryCount = options.galleryCount ?? entry.gallery?.length ?? 0;
  const gallery: ResolvedImage[] = [];

  if (entry.binding.articleId && galleryCount > 0) {
    const fromManifest = resolveGalleryFromArticle(entry.binding.articleId, galleryCount);
    gallery.push(...fromManifest);
  }

  if (gallery.length === 0 && entry.gallery) {
    for (let i = 0; i < Math.min(galleryCount, entry.gallery.length); i++) {
      const q = entry.gallery[i];
      const cached = fromCache(q);
      gallery.push(cached ?? resolveForEntry(entry, "gallery"));
    }
  }

  const sections: Record<string, ResolvedImage> = {};
  const sectionIds = options.sectionIds ?? Object.keys(entry.sections ?? {});
  for (const sectionId of sectionIds) {
    sections[sectionId] = resolveForEntry(entry, "section", sectionId);
  }

  return {
    hero: resolveForEntry(entry, "hero"),
    gallery,
    sections,
    card: entry.card ? resolveForEntry(entry, "card") : undefined,
  };
}

function resolveGalleryFromArticle(articleId: string, count: number): ResolvedImage[] {
  const assets = getAllManifestAssets()
    .filter((a) => a.articleId === articleId && a.role === "gallery")
    .sort((a, b) => a.id.localeCompare(b.id));

  const gallery: ResolvedImage[] = [];
  const seenSrc = new Set<string>();
  const seenHash = new Set<string>();
  for (const asset of assets) {
    if (gallery.length >= count) break;
    const resolved = mediaAssetToResolved(asset);
    if (seenSrc.has(resolved.src)) continue;
    if (asset.contentHash && seenHash.has(asset.contentHash)) continue;
    seenSrc.add(resolved.src);
    if (asset.contentHash) seenHash.add(asset.contentHash);
    gallery.push(resolved);
  }
  return gallery;
}

export function getHeroImage(pageId: string): ResolvedImage {
  const entry = getPageEntry(pageId);
  if (!entry) {
    const blogMatch = pageId.match(/^blog:(.+)$/);
    if (blogMatch) {
      const slug = blogMatch[1];
      const manifestResolved = resolveFromManifestBinding(
        { blogPostSlug: slug },
        "hero",
        slug,
      );
      if (manifestResolved) return manifestResolved;
      return fallbackResolvedImage(slug);
    }
    return fallbackResolvedImage(pageId);
  }
  return resolvePageImages(pageId).hero;
}

export function getGalleryImages(pageId: string, count: number): ResolvedImage[] {
  return resolvePageImages(pageId, { galleryCount: count }).gallery;
}

export function getSectionImage(pageId: string, sectionId: string): ResolvedImage {
  return resolvePageImages(pageId, { sectionIds: [sectionId] }).sections[sectionId] ??
    fallbackResolvedImage(sectionId);
}

export function getContentImage(pageId: string, sectionId: string): ResolvedImage {
  return getSectionImage(pageId, sectionId);
}

export function getBackgroundImage(pageId: string): ResolvedImage {
  const entry = getPageEntry(pageId);
  if (entry) return resolveForEntry(entry, "background");
  return fallbackResolvedImage(pageId);
}

export function getCardImage(entityId: string): ResolvedImage {
  const entry = getPageEntry(entityId);
  if (entry) return resolveForEntry(entry, "card");
  return fallbackResolvedImage(entityId);
}

export function getHeroSrc(pageId: string): string {
  return getHeroImage(pageId).src;
}

export function getHeroAlt(pageId: string): string {
  return getHeroImage(pageId).alt;
}

export function imageSizesForRole(role: ImageRole): string {
  return ROLE_SIZES[role];
}

export function listRegisteredPages(): PageRegistryEntry[] {
  return getAllPageEntries();
}
