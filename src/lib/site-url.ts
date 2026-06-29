const DEFAULT_SITE_URL = "https://www.goargentina.ru";

/**
 * True for hosts that must never be emitted as the canonical public origin
 * (Vercel preview/deployment URLs, localhost, *.local). Mirrors the guard in
 * `getProductionBrandDomain()` so canonical/OG/sitemap stay on the prod domain
 * even if `NEXT_PUBLIC_SITE_URL` resolves to a per-deployment Vercel host.
 */
function isNonCanonicalHost(value: string): boolean {
  try {
    const { hostname } = new URL(value);
    return (
      hostname.endsWith(".vercel.app") ||
      hostname === "localhost" ||
      hostname.endsWith(".local")
    );
  } catch {
    return true;
  }
}

/** Canonical public origin for sitemap, robots, and JSON-LD. */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured && !isNonCanonicalHost(configured)) {
    return configured;
  }

  return DEFAULT_SITE_URL;
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

/** Site-relative path → absolute URL; external http(s) URLs pass through unchanged. */
export function resolvePublicUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  return absoluteUrl(url);
}
