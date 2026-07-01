import { PREFIXED_I18N_LOCALES } from "./config";
import { addLocalePrefix } from "./locale-path";

/**
 * Paths eligible for /es/ and /en/ sitemap variants (E39 pilot + E43 CMS i18n).
 * Russian canonical stays unprefixed.
 */
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
  const expanded = new Set(paths);

  for (const path of paths) {
    if (!isI18nSitemapPath(path)) continue;
    for (const locale of PREFIXED_I18N_LOCALES) {
      expanded.add(addLocalePrefix(path, locale));
    }
  }

  return [...expanded];
}
