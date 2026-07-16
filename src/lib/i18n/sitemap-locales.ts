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
  // Locale fallbacks are noindex. Add translated URLs only after the CMS
  // supplies an explicit publication-aware locale registry.
  return [...new Set(paths)];
}
