import type { SearchHit } from "@/lib/search/types";

export type PublicCatalogSlice =
  | { status: "ok"; paths: ReadonlySet<string> }
  | { status: "unavailable" };

export type PublicCatalogAvailability = {
  tours: PublicCatalogSlice;
  excursions: PublicCatalogSlice;
};

function normalizePath(value: string): string {
  return value.split("?", 1)[0]?.replace(/\/$/, "") || "/";
}

function allowsCatalogHit(slice: PublicCatalogSlice, url: string): boolean {
  if (slice.status === "unavailable") {
    // Confirmed-empty and unavailable must not collapse. Keep index hits
    // when the live catalogue cannot be read.
    return true;
  }
  return slice.paths.has(normalizePath(url));
}

/**
 * Search documents live longer than partner catalogue entries. Hide stale
 * commercial results so every tour and excursion offered by search opens a
 * page that is present in the current public catalogue.
 *
 * Filter a kind only after a successful catalogue read. An empty successful
 * read hides stale commercial links; an unavailable read keeps index hits.
 */
export function filterSearchHitsByPublicCatalog(
  hits: SearchHit[],
  catalog: PublicCatalogAvailability,
): SearchHit[] {
  return hits.filter((hit) => {
    if (hit.kind === "tour") {
      return allowsCatalogHit(catalog.tours, hit.url);
    }
    if (hit.kind === "excursion") {
      return allowsCatalogHit(catalog.excursions, hit.url);
    }
    return true;
  });
}

