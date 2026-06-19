const DEFAULT_SITE_URL = "https://www.goargentina.ru";

/** Canonical public origin for sitemap, robots, and JSON-LD. */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
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
