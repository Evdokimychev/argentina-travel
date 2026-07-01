import manifestData from "@/data/media-library/manifest.json";
import {
  BLOG_CATEGORY_PLACE_MAP,
  BLOG_HUB_PLACE_MAP,
  CLIMATE_MONTH_PLACE_MAP,
  CLIMATE_REGION_MONTH_MAP,
  DESTINATION_PLACE_MAP,
  GUIDE_PAGE_PLACE_MAP,
  GUIDE_TOPIC_PLACE_MAP,
  PLACE_COVER_FALLBACK_MAP,
  RICH_ARTICLE_PLACE_MAP,
  TOUR_PLACE_MAP,
} from "@/data/media-library/maps";
import {
  getGalleryImages,
  getHeroImage,
  getHeroSrc,
  getSectionImage as getProviderSectionImage,
} from "@/lib/image-provider/image-provider";
import {
  mediaAssetToResolved,
  resolveFromManifestBinding,
} from "@/lib/image-provider/local-fallback";
import { resolveSlotAssetId } from "@/lib/image-provider/slot-ids";
import type { ResolvedImage } from "@/lib/image-provider/types";
import type { MediaAsset } from "@/types/media-asset";
import { resolveBlogSemanticHeroImage } from "@/lib/blog-post-image-bindings";
import { blogMediaFolder } from "@/lib/blog-media-path";

const manifest = manifestData as { version: number; assets: MediaAsset[] };

const assetsById = new Map(manifest.assets.map((a) => [a.id, a]));

export const MEDIA_LOGO_FALLBACK = "/logo-light.svg";

const FALLBACK = MEDIA_LOGO_FALLBACK;

/** Public URL for a file under public/ (localPath includes `media/` prefix) or absolute CMS upload URL. */
export function mediaUrl(localPath: string): string {
  const trimmed = localPath.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const normalized = trimmed.replace(/^\/+/, "");
  return normalized.startsWith("media/") ? `/${normalized}` : `/media/${normalized}`;
}

function assetsForPlace(slug: string): MediaAsset[] {
  return manifest.assets
    .filter((a) => a.placeId === slug)
    .sort((a, b) => a.id.localeCompare(b.id));
}

function assetsForDestination(id: string): MediaAsset[] {
  return manifest.assets
    .filter((a) => a.destinationId === id)
    .sort((a, b) => a.id.localeCompare(b.id));
}

function assetUrl(asset: MediaAsset | undefined): string {
  return asset ? mediaUrl(asset.localPath) : FALLBACK;
}

export function getMediaAsset(id: string): MediaAsset | undefined {
  return assetsById.get(id);
}

function placeHeroAsset(slug: string): MediaAsset | undefined {
  const own = assetsForPlace(slug);
  return own.find((a) => a.role === "hero") ?? own[0];
}

export function getPlaceCoverImage(slug: string): string {
  const hero = placeHeroAsset(slug);
  if (hero) return assetUrl(hero);

  const fallbackSlug = PLACE_COVER_FALLBACK_MAP[slug];
  if (fallbackSlug) {
    const fallbackHero = placeHeroAsset(fallbackSlug);
    if (fallbackHero) return assetUrl(fallbackHero);
  }
  return FALLBACK;
}

export function getPlaceCoverAlt(slug: string): string {
  const hero = placeHeroAsset(slug);
  if (hero?.alt) return hero.alt;

  const fallbackSlug = PLACE_COVER_FALLBACK_MAP[slug];
  if (fallbackSlug) {
    const fallbackHero = placeHeroAsset(fallbackSlug);
    if (fallbackHero?.alt) return fallbackHero.alt;
  }
  return slug;
}

export function getPlaceGallery(slug: string): string[] {
  const paths = assetsForPlace(slug).map((a) => mediaUrl(a.localPath));
  return [...new Set(paths)];
}

export function getPlaceGalleryAlts(slug: string): string[] {
  return assetsForPlace(slug).map((a) => a.alt);
}

export function getDestinationImage(destinationId: string): string {
  const fromSection = resolveFromManifestBinding(
    { destinationId },
    "section",
    destinationId,
  );
  if (fromSection) return fromSection.src;
  return getHeroSrc(`destination:${destinationId}`);
}

export function getDestinationGallery(destinationId: string): string[] {
  const fromManifest = assetsForDestination(destinationId).map((a) => mediaUrl(a.localPath));
  if (fromManifest.length > 0) return [...new Set(fromManifest)];

  const placeSlug = DESTINATION_PLACE_MAP[destinationId];
  if (!placeSlug) return [];
  return getPlaceGallery(placeSlug);
}

export function getDestinationImageAlt(destinationId: string): string {
  const fromSection = resolveFromManifestBinding(
    { destinationId },
    "section",
    destinationId,
  );
  if (fromSection) return fromSection.alt;
  return getHeroImage(`destination:${destinationId}`).alt;
}

export function getBlogCategoryImage(categoryKey: string): string {
  const blogAsset = manifest.assets.find(
    (a) => a.blogCategory === categoryKey && a.role === "hero",
  );
  if (blogAsset) return assetUrl(blogAsset);

  const blogAssetAny = manifest.assets.find((a) => a.blogCategory === categoryKey);
  if (blogAssetAny) return assetUrl(blogAssetAny);

  const topicImage = resolveBlogSemanticHeroImage({
    slug: `category-${categoryKey}`,
    category: categoryKey,
    tags: [],
  });
  if (!isMediaLogoFallback(topicImage)) return topicImage;

  const placeSlug = BLOG_CATEGORY_PLACE_MAP[categoryKey];
  if (placeSlug) return getPlaceCoverImage(placeSlug);
  return getPlaceCoverImage("buenos-aires");
}

export function getBlogCategoryAlt(categoryKey: string): string {
  const blogAsset = manifest.assets.find((a) => a.blogCategory === categoryKey);
  if (blogAsset?.alt) return blogAsset.alt;
  return categoryKey;
}

const BLOG_HUB_CATEGORY_KEY: Record<string, string> = {
  "Деньги и обмен валют": "money",
  "Интернет и связь": "internet",
  Иммиграция: "relocation",
  "Переезд и релокация": "relocation",
  Транспорт: "transport",
  Безопасность: "safety",
  "Кухня Аргентины": "food",
  Винодельни: "wineries",
};

export function getBlogHubImage(hubLabel: string): string {
  const categoryKey = BLOG_HUB_CATEGORY_KEY[hubLabel];
  if (categoryKey) {
    const categoryImage = getBlogCategoryImage(categoryKey);
    if (!isMediaLogoFallback(categoryImage)) return categoryImage;
  }

  const placeSlug = BLOG_HUB_PLACE_MAP[hubLabel];
  if (placeSlug) return getPlaceCoverImage(placeSlug);
  return getPlaceCoverImage("buenos-aires");
}

function manifestHeroBy(field: keyof MediaAsset, value: string): MediaAsset | undefined {
  return manifest.assets.find((a) => a[field] === value && a.role === "hero");
}

function manifestClimateByKey(key: string): MediaAsset | undefined {
  return manifest.assets.find((a) => a.climateKey === key);
}

export function getGuideTopicHeroImage(topicSlug: string): string {
  return getHeroSrc(`guide:${topicSlug}`);
}

export function getGuideTopicHeroAlt(topicSlug: string): string {
  return getHeroImage(`guide:${topicSlug}`).alt;
}

export function getGuidePageHeroImage(pageSlug: string): string {
  const asset = manifestHeroBy("guidePageSlug", pageSlug);
  if (asset) return assetUrl(asset);
  const placeSlug = GUIDE_PAGE_PLACE_MAP[pageSlug];
  if (placeSlug) return getPlaceCoverImage(placeSlug);
  return getPlaceCoverImage("buenos-aires");
}

function assetsForTour(slug: string): MediaAsset[] {
  return manifest.assets
    .filter((a) => a.tourSlug === slug)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function getTourCoverImage(tourSlug: string): string {
  const hero =
    assetsForTour(tourSlug).find((a) => a.role === "hero") ?? assetsForTour(tourSlug)[0];
  if (hero) return assetUrl(hero);
  const placeSlug = TOUR_PLACE_MAP[tourSlug];
  if (placeSlug) return getPlaceCoverImage(placeSlug);
  return FALLBACK;
}

export function getTourGallery(tourSlug: string): string[] {
  const fromManifest = assetsForTour(tourSlug).map((a) => mediaUrl(a.localPath));
  if (fromManifest.length > 0) return [...new Set(fromManifest)];
  const placeSlug = TOUR_PLACE_MAP[tourSlug];
  if (placeSlug) return getPlaceGallery(placeSlug);
  return [getTourCoverImage(tourSlug)];
}

export function getClimateMonthImage(regionId: string, month: number): string {
  const regionKey = `${regionId}-${month}`;
  const regional = manifestClimateByKey(regionKey);
  if (regional) return assetUrl(regional);

  const placeOverride = CLIMATE_REGION_MONTH_MAP[regionId]?.[month];
  if (placeOverride) return getPlaceCoverImage(placeOverride);

  const global = manifestClimateByKey(`global-${month}`);
  if (global) return assetUrl(global);

  const placeSlug = CLIMATE_MONTH_PLACE_MAP[month];
  if (placeSlug) return getPlaceCoverImage(placeSlug);
  return getPlaceCoverImage("buenos-aires");
}

export function getAllMediaAssets(): MediaAsset[] {
  return manifest.assets;
}

function stockHeroBy(field: keyof MediaAsset, value: string): MediaAsset | undefined {
  return manifest.assets.find((a) => a[field] === value && a.role === "hero");
}

function stockAssetsBy(field: keyof MediaAsset, value: string): MediaAsset[] {
  return manifest.assets
    .filter((a) => a[field] === value)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function getImmigrationTopicHeroImage(topicSlug: string): string {
  return getHeroSrc(`immigration:${topicSlug}`);
}

export function getImmigrationTopicHeroAlt(topicSlug: string): string {
  return getHeroImage(`immigration:${topicSlug}`).alt;
}

export function getImmigrationHubHeroImage(): string {
  return getHeroSrc("immigration:hub");
}

export function getHomeHeroImage(): string {
  return getServicePageHeroImage("home");
}

export function getHomeHeroAlt(): string {
  return getServicePageHeroAlt("home");
}

export function getPlacesCatalogHeroImage(): string {
  return getHeroSrc("places:index");
}

export function getPlacesCatalogHeroAlt(): string {
  return getHeroImage("places:index").alt;
}

export function getServicePageHeroImage(pageId: string): string {
  return getHeroSrc(`service:${pageId}`);
}

export function getServicePageHeroAlt(pageId: string): string {
  return getHeroImage(`service:${pageId}`).alt;
}

export function getPodborRegionImage(regionId: string): string {
  return getHeroSrc(`podbor:region:${regionId}`);
}

export function getPodborRegionAlt(regionId: string): string {
  return getHeroImage(`podbor:region:${regionId}`).alt;
}

export function getPodborThemeImage(themeId: string): string {
  const asset =
    manifest.assets.find((a) => a.podborThemeId === themeId && a.role === "thumbnail") ??
    stockHeroBy("podborThemeId", themeId);
  if (asset) return assetUrl(asset);
  return getHeroSrc(`podbor:theme:${themeId}`);
}

export function getShopProductImage(productId: string): string {
  return getHeroSrc(`shop:${productId}`);
}

export function getShopProductAlt(productId: string): string {
  return getHeroImage(`shop:${productId}`).alt;
}

function manifestBlogHero(slug: string): MediaAsset | undefined {
  const direct = manifest.assets.find((a) => a.blogPostSlug === slug && a.role === "hero");
  if (direct) return direct;

  const folder = blogMediaFolder(slug);
  return manifest.assets.find(
    (a) => a.role === "hero" && a.localPath.replace(/^\/+/, "").endsWith(`blog/${folder}/hero.jpg`),
  );
}

export function isMediaLogoFallback(src: string): boolean {
  return src === MEDIA_LOGO_FALLBACK;
}

/** Card/listing cover: semantic topic pool → rich → legacy fallbacks. */
export function resolveBlogPostCardImage(post: {
  slug: string;
  image?: string;
  category: string;
  richArticleId?: string;
  tags?: string[];
}): string {
  if (post.richArticleId) {
    const rich = getRichArticleHeroImage(post.richArticleId);
    if (!isMediaLogoFallback(rich)) return rich;
  }

  const semantic = resolveBlogSemanticHeroImage({
    slug: post.slug,
    category: post.category,
    tags: post.tags ?? [],
  });
  if (!isMediaLogoFallback(semantic)) return semantic;

  const manifestHero = manifestBlogHero(post.slug);
  if (manifestHero) return mediaUrl(manifestHero.localPath);

  const cover = getHeroSrc(`blog:${post.slug}`);
  if (!isMediaLogoFallback(cover)) return cover;

  if (post.image && post.image !== "" && !isMediaLogoFallback(post.image)) {
    return post.image;
  }

  const hub = getBlogHubImage(post.category);
  if (!isMediaLogoFallback(hub)) return hub;

  return cover;
}

export function getBlogPostCoverImage(slug: string): string {
  const manifestHero = manifestBlogHero(slug);
  if (manifestHero) return mediaUrl(manifestHero.localPath);
  return getHeroSrc(`blog:${slug}`);
}

export function getBlogPostCoverAlt(slug: string): string {
  const manifestHero = manifestBlogHero(slug);
  if (manifestHero?.alt) return manifestHero.alt;
  return getHeroImage(`blog:${slug}`).alt;
}

/** Manifest thumbnail paired with a gallery/full image (contentHash match). */
export function getManifestThumbnailSrc(src: string): string | undefined {
  const asset = manifest.assets.find((a) => mediaUrl(a.localPath) === src);
  if (!asset?.contentHash) return undefined;

  const thumb = manifest.assets.find(
    (a) => a.role === "thumbnail" && a.contentHash === asset.contentHash,
  );
  return thumb ? mediaUrl(thumb.localPath) : undefined;
}

/** Post page hero with manifest attribution (LCP element). */
export function getBlogPostHeroResolved(post: {
  slug: string;
  title: string;
  category: string;
  tags?: string[];
  richArticleId?: string;
}): ResolvedImage {
  if (post.richArticleId) {
    const richHero = getHeroImage(`rich:${post.richArticleId}`);
    if (!isMediaLogoFallback(richHero.src)) return richHero;
  }

  const semanticSrc = resolveBlogSemanticHeroImage({
    slug: post.slug,
    category: post.category,
    tags: post.tags ?? [],
  });
  if (!isMediaLogoFallback(semanticSrc)) {
    const manifestHero = manifestBlogHero(post.slug);
    if (manifestHero && mediaUrl(manifestHero.localPath) === semanticSrc) {
      return mediaAssetToResolved(manifestHero);
    }

    const alt = getBlogPostCoverAlt(post.slug) || post.title;
    const normalized = semanticSrc.replace(/^\//, "");
    const pathAsset = manifest.assets.find((asset) => {
      const assetPath = asset.localPath.replace(/^\/+/, "");
      return assetPath === normalized || mediaUrl(asset.localPath) === semanticSrc;
    });
    if (pathAsset) return mediaAssetToResolved(pathAsset);

    return {
      src: semanticSrc,
      alt,
      title: alt,
      attribution: {
        authorName: "Пора в Аргентину",
        sourceUrl: "https://www.goargentina.ru",
        license: "© Пора в Аргентину",
        source: "local",
      },
      attributionHtml: "© Пора в Аргентину",
    };
  }

  const manifestHero = manifestBlogHero(post.slug);
  if (manifestHero) return mediaAssetToResolved(manifestHero);

  const blogHero = getHeroImage(`blog:${post.slug}`);
  if (!isMediaLogoFallback(blogHero.src)) return blogHero;

  return { ...blogHero, alt: getBlogPostCoverAlt(post.slug) || post.title };
}

export function getRichArticleGallery(articleId: string): Array<{
  src: string;
  alt: string;
  caption?: string;
  attributionHtml?: string;
  thumbSrc?: string;
}> {
  const seenSrc = new Set<string>();
  const seenHash = new Set<string>();
  const gallery: Array<{
    src: string;
    alt: string;
    caption?: string;
    attributionHtml?: string;
    thumbSrc?: string;
  }> = [];

  const addImage = (
    src: string,
    alt: string,
    contentHash?: string,
    caption?: string,
    attributionHtml?: string,
  ) => {
    if (seenSrc.has(src)) return;
    if (contentHash && seenHash.has(contentHash)) return;
    seenSrc.add(src);
    if (contentHash) seenHash.add(contentHash);
    gallery.push({
      src,
      alt,
      caption,
      attributionHtml,
      thumbSrc: getManifestThumbnailSrc(src),
    });
  };

  for (const img of getGalleryImages(`rich:${articleId}`, 5)) {
    const asset = manifest.assets.find(
      (a) => a.articleId === articleId && a.role === "gallery" && mediaUrl(a.localPath) === img.src,
    );
    addImage(
      img.src,
      img.alt,
      asset?.contentHash,
      asset?.imageTitle ?? asset?.title ?? asset?.caption,
      asset?.attributionHtml,
    );
    if (gallery.length >= 5) break;
  }

  if (gallery.length < 5) {
    const placeId = RICH_ARTICLE_PLACE_MAP[articleId];
    if (placeId) {
      const placeGallery = manifest.assets
        .filter((a) => a.placeId === placeId && a.role === "gallery")
        .sort((a, b) => a.id.localeCompare(b.id));
      for (const asset of placeGallery) {
        addImage(
          mediaUrl(asset.localPath),
          asset.alt,
          asset.contentHash,
          asset.imageTitle ?? asset.title ?? asset.caption,
          asset.attributionHtml,
        );
        if (gallery.length >= 5) break;
      }
    }
  }

  return gallery;
}

export function getRichArticleHeroImage(articleId: string): string {
  const galleryHero = manifest.assets
    .filter((a) => a.articleId === articleId && a.role === "gallery")
    .sort((a, b) => a.id.localeCompare(b.id))[0];
  if (galleryHero) return assetUrl(galleryHero);

  const articleHero = manifest.assets.find(
    (a) => a.articleId === articleId && a.role === "hero",
  );
  if (articleHero) return assetUrl(articleHero);

  const placeId = RICH_ARTICLE_PLACE_MAP[articleId];
  if (placeId) return getPlaceCoverImage(placeId);

  return getHeroSrc(`rich:${articleId}`);
}

export function getContentImage(pageId: string, slotId: string): ResolvedImage {
  const assetId = resolveSlotAssetId(pageId, slotId);
  const asset = getMediaAsset(assetId);
  if (asset) return mediaAssetToResolved(asset);
  return getProviderSectionImage(pageId, slotId);
}

/** True when manifest has a dedicated slot asset with a non-logo image src. */
export function hasContentSlotImage(pageId: string, slotId: string): boolean {
  const assetId = resolveSlotAssetId(pageId, slotId);
  const asset = getMediaAsset(assetId);
  if (!asset) return false;
  return !isMediaLogoFallback(mediaUrl(asset.localPath));
}

export function getContentImageSrc(pageId: string, slotId: string): string {
  return getContentImage(pageId, slotId).src;
}

export function getSectionImages(pageId: string, slotIds: string[]): ResolvedImage[] {
  return slotIds.map((slotId) => getContentImage(pageId, slotId));
}

export function getHomeShowcaseImages(): ResolvedImage[] {
  return getSectionImages("service:home", [
    "showcase-patagonia",
    "showcase-iguazu",
    "showcase-ba",
  ]);
}

export function getServiceCategoryCardImage(categoryId: string): ResolvedImage {
  return getContentImage("service:services", `card-${categoryId}`);
}
