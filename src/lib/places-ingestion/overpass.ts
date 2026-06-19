import type { IngestedPlaceDraft, IngestionFetcher, IngestionQuery } from "./types";

/**
 * Overpass API stub — implement QL queries for tourism=attraction, natural=*, boundary=national_park in Argentina.
 * Example bbox: Argentina approx [-55,-73,-21,-53]
 */
export const overpassFetcher: IngestionFetcher = {
  source: "overpass",
  async fetch(_query: IngestionQuery): Promise<IngestedPlaceDraft[]> {
    // Stub: full Overpass QL implementation deferred to cron job
    return [];
  },
};

export function buildOverpassQuery(bbox: [number, number, number, number]): string {
  const [south, west, north, east] = bbox;
  return `
    [out:json][timeout:60];
    (
      node["tourism"="attraction"](${south},${west},${north},${east});
      way["boundary"="national_park"](${south},${west},${north},${east});
      node["natural"="peak"](${south},${west},${north},${east});
    );
    out center tags;
  `.trim();
}
