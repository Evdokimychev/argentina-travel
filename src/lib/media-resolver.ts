import manifestData from "@/data/media-library/manifest.json";
import {
  BLOG_CATEGORY_PLACE_MAP,
  BLOG_HUB_PLACE_MAP,
  CLIMATE_MONTH_PLACE_MAP,
  CLIMATE_REGION_MONTH_MAP,
  DESTINATION_PLACE_MAP,
  GUIDE_PAGE_PLACE_MAP,
  GUIDE_TOPIC_PLACE_MAP,
  TOUR_PLACE_MAP,
} from "@/data/media-library/maps";
import type { MediaAsset } from "@/types/media-asset";

const manifest = manifestData as { version: number; assets: MediaAsset[] };

const assetsById = new Map(manifest.assets.map((a) => [a.id, a]));

const FALLBACK = "/logo-light.svg";

/** Public URL for a file under public/ (localPath includes `media/` prefix). */
export function mediaUrl(localPath: string): string {
  const normalized = localPath.replace(/^\/+/, "");
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

export function getPlaceCoverImage(slug: string): string {
  const hero =
    assetsForPlace(slug).find((a) => a.role === "hero") ?? assetsForPlace(slug)[0];
  return assetUrl(hero);
}

export function getPlaceCoverAlt(slug: string): string {
  const hero =
    assetsForPlace(slug).find((a) => a.role === "hero") ?? assetsForPlace(slug)[0];
  return hero?.alt ?? slug;
}

export function getPlaceGallery(slug: string): string[] {
  const paths = assetsForPlace(slug).map((a) => mediaUrl(a.localPath));
  return [...new Set(paths)];
}

export function getPlaceGalleryAlts(slug: string): string[] {
  return assetsForPlace(slug).map((a) => a.alt);
}

export function getDestinationImage(destinationId: string): string {
  const cover =
    assetsForDestination(destinationId).find((a) => a.role === "hero") ??
    assetsForDestination(destinationId)[0];
  if (cover) return assetUrl(cover);

  const placeSlug = DESTINATION_PLACE_MAP[destinationId];
  if (placeSlug) return getPlaceCoverImage(placeSlug);
  return FALLBACK;
}

export function getDestinationGallery(destinationId: string): string[] {
  const fromManifest = assetsForDestination(destinationId).map((a) => mediaUrl(a.localPath));
  if (fromManifest.length > 0) return [...new Set(fromManifest)];

  const placeSlug = DESTINATION_PLACE_MAP[destinationId];
  if (!placeSlug) return [];
  return getPlaceGallery(placeSlug);
}

export function getDestinationImageAlt(destinationId: string): string {
  const cover =
    assetsForDestination(destinationId).find((a) => a.role === "hero") ??
    assetsForDestination(destinationId)[0];
  if (cover?.alt) return cover.alt;

  const placeSlug = DESTINATION_PLACE_MAP[destinationId];
  if (placeSlug) return getPlaceCoverAlt(placeSlug);
  return destinationId;
}

export function getBlogCategoryImage(categoryKey: string): string {
  const blogAsset = manifest.assets.find((a) => a.blogCategory === categoryKey);
  if (blogAsset) return assetUrl(blogAsset);

  const placeSlug = BLOG_CATEGORY_PLACE_MAP[categoryKey];
  if (placeSlug) return getPlaceCoverImage(placeSlug);
  return getPlaceCoverImage("buenos-aires");
}

export function getBlogCategoryAlt(categoryKey: string): string {
  const blogAsset = manifest.assets.find((a) => a.blogCategory === categoryKey);
  if (blogAsset?.alt) return blogAsset.alt;
  return categoryKey;
}

export function getBlogHubImage(hubLabel: string): string {
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
  const asset = manifestHeroBy("guideTopicId", topicSlug);
  if (asset) return assetUrl(asset);
  const placeSlug = GUIDE_TOPIC_PLACE_MAP[topicSlug];
  if (placeSlug) return getPlaceCoverImage(placeSlug);
  return getPlaceCoverImage("buenos-aires");
}

export function getGuideTopicHeroAlt(topicSlug: string): string {
  const asset = manifestHeroBy("guideTopicId", topicSlug);
  if (asset?.alt) return asset.alt;
  const placeSlug = GUIDE_TOPIC_PLACE_MAP[topicSlug];
  if (placeSlug) return getPlaceCoverAlt(placeSlug);
  return topicSlug;
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
