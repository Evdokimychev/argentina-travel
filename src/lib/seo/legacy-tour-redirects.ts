/**
 * Semantic WordPress /st_tour/* redirects placed above the catch-all in next.config.ts.
 * Targets are editorially chosen landing pages, not guessed partner slugs.
 */
export type LegacyTourRedirect = {
  source: string;
  destination: string;
  permanent: true;
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
    source: "/st_tour/patagonia-:path*",
    destination: "/tours/region/patagonia",
    permanent: true,
  },
  {
    source: "/st_tour/buenos-aires",
    destination: "/tours",
    permanent: true,
  },
  {
    source: "/st_tour/buenos-aires-:path*",
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
