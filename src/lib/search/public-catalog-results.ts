import type { SearchHit } from "@/lib/search/types";

type PublicCatalogPathSets = {
  tours: ReadonlySet<string>;
  excursions: ReadonlySet<string>;
};

function normalizePath(value: string): string {
  return value.split("?", 1)[0]?.replace(/\/$/, "") || "/";
}

/**
 * Search documents live longer than partner catalogue entries. Hide stale
 * commercial results so every tour and excursion offered by search opens a
 * page that is present in the current public catalogue.
 */
export function filterSearchHitsByPublicCatalog(
  hits: SearchHit[],
  catalog: PublicCatalogPathSets,
): SearchHit[] {
  return hits.filter((hit) => {
    if (hit.kind === "tour") {
      return catalog.tours.has(normalizePath(hit.url));
    }
    if (hit.kind === "excursion") {
      return catalog.excursions.has(normalizePath(hit.url));
    }
    return true;
  });
}

