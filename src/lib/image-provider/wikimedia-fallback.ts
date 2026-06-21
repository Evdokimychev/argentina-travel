import manifestData from "@/data/media-library/manifest.json";
import { buildAttributionHtml } from "./attribution";
import { mediaAssetToResolved } from "./local-fallback";
import type { ImageQuery, ResolvedImage } from "./types";
import type { MediaAsset, MediaSource } from "@/types/media-asset";

const manifest = manifestData as { version: number; assets: MediaAsset[] };

function isWikimediaSource(source: MediaSource): boolean {
  return source === "wikimedia" || source === "wikipedia";
}

function scoreAsset(asset: MediaAsset, query: ImageQuery): number {
  let score = 0;
  const q = query.query.toLowerCase();
  const tags = (asset.tags ?? []).map((t) => t.toLowerCase());

  if (asset.role === query.role || (query.role === "content" && asset.role === "section")) {
    score += 10;
  }
  for (const tag of tags) {
    if (q.includes(tag) || tag.split("-").some((part) => q.includes(part))) score += 3;
  }
  if (asset.alt && query.alt && asset.alt.includes(query.alt.slice(0, 20))) score += 2;
  return score;
}

export function findWikimediaAssets(query: ImageQuery): MediaAsset[] {
  return manifest.assets
    .filter((a) => isWikimediaSource(a.source))
    .sort((a, b) => scoreAsset(b, query) - scoreAsset(a, query));
}

export function resolveFromWikimedia(query: ImageQuery): ResolvedImage | null {
  const candidates = findWikimediaAssets(query);
  const best = candidates[0];
  if (!best) return null;

  const resolved = mediaAssetToResolved(best);
  if (!resolved.alt && query.alt) resolved.alt = query.alt;
  if (!resolved.title && query.title) resolved.title = query.title;
  if (!resolved.description && query.description) resolved.description = query.description;
  if (!resolved.attributionHtml) {
    resolved.attributionHtml = buildAttributionHtml(resolved.attribution, best.source);
  }
  return resolved;
}

export function listWikimediaByPlace(placeId: string): MediaAsset[] {
  return manifest.assets.filter((a) => a.placeId === placeId && isWikimediaSource(a.source));
}
