/**
 * Semantic WordPress /st_tour/* redirects placed above the catch-all in next.config.ts.
 * Targets are editorially chosen landing pages, not guessed partner slugs.
 *
 * IMPORTANT: Next.js path-to-regexp forbids glued repeating params like
 * `/st_tour/patagonia-:path*`. Use exact sources here and prefix matchers
 * in `LEGACY_WP_TOUR_PREFIX_REDIRECTS` (middleware) for hyphenated variants.
 */
export type LegacyTourRedirect = {
  source: string;
  destination: string;
  permanent: true;
};

export type LegacyTourPrefixRedirect = {
  /** Match when pathname equals prefix or starts with `${prefix}-` / `${prefix}/`. */
  prefix: string;
  destination: string;
};

export const LEGACY_WP_TOUR_REDIRECTS: LegacyTourRedirect[] = [
  {
    source: "/st_tour/iguazu-1-day",
    destination: "/tours/region/iguazu",
    permanent: true,
  },
  {
    source: "/st_tour/iguazu-argentina-2-days",
    destination: "/tours/region/iguazu",
    permanent: true,
  },
  {
    source: "/st_tour/iguazu-2-days",
    destination: "/tours/region/iguazu",
    permanent: true,
  },
  {
    source: "/st_tour/iguazu-3-days",
    destination: "/tours/region/iguazu",
    permanent: true,
  },
  {
    source: "/st_tour/patagonia",
    destination: "/tours/region/patagonia",
    permanent: true,
  },
  {
    source: "/st_tour/buenos-aires",
    destination: "/tours",
    permanent: true,
  },
  {
    source: "/st_tour/ushuaia",
    destination: "/tours/region/patagonia",
    permanent: true,
  },
  {
    source: "/st_tour/el-calafate",
    destination: "/tours/region/patagonia",
    permanent: true,
  },
  {
    source: "/st_tour/bariloche",
    destination: "/tours/region/patagonia",
    permanent: true,
  },
  {
    source: "/st_tour/mendoza",
    destination: "/tours",
    permanent: true,
  },
  {
    source: "/st_tour/salta",
    destination: "/tours",
    permanent: true,
  },
];

/**
 * Prefix matchers for historic WP slugs like `/st_tour/patagonia-10-days`.
 * Evaluated in middleware before the next.config catch-all.
 */
export const LEGACY_WP_TOUR_PREFIX_REDIRECTS: LegacyTourPrefixRedirect[] = [
  { prefix: "/st_tour/iguazu", destination: "/tours/region/iguazu" },
  { prefix: "/st_tour/patagonia", destination: "/tours/region/patagonia" },
  { prefix: "/st_tour/buenos-aires", destination: "/tours" },
  { prefix: "/st_tour/ushuaia", destination: "/tours/region/patagonia" },
  { prefix: "/st_tour/el-calafate", destination: "/tours/region/patagonia" },
  { prefix: "/st_tour/bariloche", destination: "/tours/region/patagonia" },
  { prefix: "/st_tour/mendoza", destination: "/tours" },
  { prefix: "/st_tour/salta", destination: "/tours" },
];

export function matchLegacyTourPrefixRedirect(pathname: string): string | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (!normalized.startsWith("/st_tour/")) return null;

  for (const entry of LEGACY_WP_TOUR_PREFIX_REDIRECTS) {
    if (
      normalized === entry.prefix ||
      normalized.startsWith(`${entry.prefix}-`) ||
      normalized.startsWith(`${entry.prefix}/`)
    ) {
      return entry.destination;
    }
  }

  return null;
}
