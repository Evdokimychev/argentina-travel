import { mediaUrl } from "@/lib/media/media-cdn";
import manifestData from "@/data/media-library/manifest.json";
import { DESTINATION_PLACE_MAP } from "@/data/media-library/maps";
import { buildAttributionHtml } from "./attribution";
import type { ImageRole, ResolvedImage } from "./types";
import type { MediaAsset } from "@/types/media-asset";

export { mediaUrl } from "@/lib/media/media-cdn";

const manifest = manifestData as { version: number; assets: MediaAsset[] };
const assetsById = new Map(manifest.assets.map((a) => [a.id, a]));

const FALLBACK_SRC = "/logo-light.svg";

export interface ManifestBinding {
  assetId?: string;
  immigrationTopicId?: string;
  servicePageId?: string;
  podborRegionId?: string;
  podborThemeId?: string;
  shopProductId?: string;
  blogPostSlug?: string;
  articleId?: string;
  guideTopicId?: string;
  guidePageSlug?: string;
  tourSlug?: string;
  destinationId?: string;
  placeId?: string;
  blogCategory?: string;
  climateKey?: string;
}

function stockHeroBy(field: keyof MediaAsset, value: string): MediaAsset | undefined {
  return manifest.assets.find((a) => a[field] === value && a.role === "hero");
}

function stockAssetsBy(field: keyof MediaAsset, value: string): MediaAsset[] {
  return manifest.assets
    .filter((a) => a[field] === value)
    .sort((a, b) => a.id.localeCompare(b.id));
}

function assetsForPlace(slug: string): MediaAsset[] {
  return manifest.assets
    .filter((a) => a.placeId === slug)
    .sort((a, b) => a.id.localeCompare(b.id));
}

function mapSourceKind(source: MediaAsset["source"]): ResolvedImage["attribution"]["source"] {
  if (source === "unsplash" || source === "pexels" || source === "wikimedia" || source === "local") {
    return source;
  }
  if (source === "wikipedia") return "wikimedia";
  return "local";
}

function attributionFromAsset(asset: MediaAsset): ResolvedImage["attribution"] {
  return {
    authorName: asset.author ?? "Unknown",
    authorProfileUrl: asset.authorProfileUrl,
    sourceUrl: asset.sourceUrl,
    source: mapSourceKind(asset.source),
    license: asset.license,
  };
}

export function mediaAssetToResolved(asset: MediaAsset): ResolvedImage {
  const attribution = attributionFromAsset(asset);
  return {
    src: mediaUrl(asset.localPath),
    alt: asset.alt,
    title: asset.imageTitle ?? asset.title,
    description: asset.imageDescription ?? asset.caption,
    attribution,
    attributionHtml: asset.attributionHtml ?? buildAttributionHtml(attribution, asset.source),
    localPath: asset.localPath,
  };
}

function resolveAsset(asset: MediaAsset | undefined, fallbackAlt: string): ResolvedImage | null {
  if (!asset) return null;
  const resolved = mediaAssetToResolved(asset);
  if (!resolved.alt) resolved.alt = fallbackAlt;
  return resolved;
}

function placeHero(slug: string): MediaAsset | undefined {
  return assetsForPlace(slug).find((a) => a.role === "hero") ?? assetsForPlace(slug)[0];
}

export function resolveFromManifestBinding(
  binding: ManifestBinding,
  role: ImageRole,
  fallbackAlt: string,
): ResolvedImage | null {
  if (binding.assetId) {
    const asset = assetsById.get(binding.assetId);
    if (asset) return resolveAsset(asset, fallbackAlt);
  }

  const heroLookup: Array<[keyof MediaAsset, string | undefined]> = [
    ["immigrationTopicId", binding.immigrationTopicId],
    ["servicePageId", binding.servicePageId],
    ["podborRegionId", binding.podborRegionId],
    ["podborThemeId", binding.podborThemeId],
    ["shopProductId", binding.shopProductId],
    ["blogPostSlug", binding.blogPostSlug],
    ["articleId", binding.articleId],
    ["guideTopicId", binding.guideTopicId],
    ["guidePageSlug", binding.guidePageSlug],
    ["tourSlug", binding.tourSlug],
    ["destinationId", binding.destinationId],
    ["blogCategory", binding.blogCategory],
    ["climateKey", binding.climateKey],
  ];

  for (const [field, value] of heroLookup) {
    if (!value) continue;
    if (role === "gallery") {
      const gallery = stockAssetsBy(field, value).filter((a) => a.role === "gallery");
      if (gallery.length > 0) return resolveAsset(gallery[0], fallbackAlt);
    } else if (role === "section" || role === "content" || role === "card") {
      const matching = stockAssetsBy(field, value).filter((a) => a.role === role);
      if (matching.length > 0) return resolveAsset(matching[0], fallbackAlt);
    } else {
      const hero = stockHeroBy(field, value);
      if (hero && (role === "hero" || role === "background" || hero.role === role)) {
        return resolveAsset(hero, fallbackAlt);
      }
    }
  }

  if (binding.placeId) {
    const placeAsset =
      role === "gallery"
        ? stockAssetsBy("placeId", binding.placeId).find((a) => a.role === "gallery")
        : placeHero(binding.placeId);
    if (placeAsset) return resolveAsset(placeAsset, fallbackAlt);
  }

  if (binding.destinationId) {
    const placeSlug = DESTINATION_PLACE_MAP[binding.destinationId];
    if (placeSlug) {
      const placeAsset = placeHero(placeSlug);
      if (placeAsset) return resolveAsset(placeAsset, fallbackAlt);
    }
  }

  return null;
}

export function fallbackResolvedImage(alt: string): ResolvedImage {
  return {
    src: FALLBACK_SRC,
    alt,
    title: alt,
    attribution: {
      authorName: "Пора в Аргентину",
      sourceUrl: "https://www.goargentina.ru",
      license: "© Пора в Аргентину",
    },
    attributionHtml: "© Пора в Аргентину",
  };
}

export function getManifestAsset(id: string): MediaAsset | undefined {
  return assetsById.get(id);
}

export function getAllManifestAssets(): MediaAsset[] {
  return manifest.assets;
}
