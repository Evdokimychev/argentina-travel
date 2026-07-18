import { filterRuSitemapPaths } from "@/lib/seo/publication-registry";

export type SitemapLocale = "en" | "es";

export interface PublishedLocaleRoute {
  locale: SitemapLocale;
  ruPath: string;
  localizedPath: string;
  published: true;
  indexable: true;
  canonicalPath: string;
}

/**
 * Explicit locale publication registry. It stays empty while /es and /en are
 * RU fallback rewrites with noindex. A translation may be added only after its
 * own content, reciprocal hreflang and self-canonical have been verified.
 */
export const PUBLISHED_LOCALE_ROUTES: readonly PublishedLocaleRoute[] = [];

/** Paths structurally eligible for a future complete translation. */
export function isI18nSitemapPath(path: string): boolean {
  if (path.includes("?")) return false;

  if (path === "/" || path === "/tours" || path === "/excursions") return true;
  if (path === "/guide" || path === "/immigration") return true;
  if (path === "/blog" || path.startsWith("/blog/")) return true;
  if (path === "/destinations" || path.startsWith("/destinations/")) return true;
  if (path === "/places" || path.startsWith("/places/")) return true;
  if (path.startsWith("/guide/")) return true;
  if (path.startsWith("/legal/")) return true;

  return false;
}

export function expandI18nSitemapPaths(paths: string[]): string[] {
  const ruPaths = filterRuSitemapPaths(paths);
  const ruPathSet = new Set(ruPaths);
  const publishedLocalePaths = PUBLISHED_LOCALE_ROUTES.filter(
    (entry) =>
      ruPathSet.has(entry.ruPath) &&
      entry.published &&
      entry.indexable &&
      entry.localizedPath === entry.canonicalPath,
  ).map((entry) => entry.localizedPath);

  return [...new Set([...ruPaths, ...publishedLocalePaths])];
}
