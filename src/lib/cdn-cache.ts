/** Cache-Control presets for CDN-friendly public API responses (tile-adjacent map data). */

export type CdnCacheProfile = "map-layers" | "static-geo" | "short";

const PROFILES: Record<CdnCacheProfile, string> = {
  "map-layers": "public, s-maxage=120, stale-while-revalidate=600",
  "static-geo": "public, s-maxage=86400, stale-while-revalidate=604800",
  short: "public, s-maxage=30, stale-while-revalidate=120",
};

export function cdnCacheControlHeader(profile: CdnCacheProfile): string {
  return PROFILES[profile];
}

export function withCdnCacheHeaders(
  init: ResponseInit | undefined,
  profile: CdnCacheProfile
): ResponseInit {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", cdnCacheControlHeader(profile));
  return { ...init, headers };
}
