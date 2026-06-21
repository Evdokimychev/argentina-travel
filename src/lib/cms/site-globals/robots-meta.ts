import type { Metadata } from "next";

/** Site-wide robots directives from `site.seo.allowIndexing`. */
export function siteRobotsMetadata(allowIndexing: boolean): NonNullable<Metadata["robots"]> {
  if (allowIndexing) {
    return { index: true, follow: true };
  }

  return {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  };
}
