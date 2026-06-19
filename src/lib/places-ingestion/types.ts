/**
 * Places ingestion architecture — interfaces for external data sources.
 *
 * Future pipeline:
 * 1. Fetch raw records from OSM/Wikipedia/Wikidata/GeoNames
 * 2. Normalize via `normalizeIngestedPlace`
 * 3. Dedupe by wikidataId / osmId / coordinates
 * 4. Upsert into Prisma via repository (admin/cron)
 *
 * Manual curated seed remains source of truth until ingestion is enabled.
 */

export type IngestedPlaceDraft = {
  externalId: string;
  source: "openstreetmap" | "overpass" | "wikimedia" | "wikipedia" | "wikidata" | "geonames";
  name: string;
  slugSuggestion: string;
  shortDescription?: string;
  fullDescription?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  tags?: string[];
  coverImage?: string;
  gallery?: string[];
  website?: string;
  wikidataId?: string;
  osmId?: string;
};

export type IngestionFetcher = {
  source: IngestedPlaceDraft["source"];
  /** Fetch places matching a bounding box or query */
  fetch: (query: IngestionQuery) => Promise<IngestedPlaceDraft[]>;
};

export type IngestionQuery = {
  bbox?: [number, number, number, number];
  name?: string;
  wikidataId?: string;
  limit?: number;
};

export interface PlacesIngestionPipeline {
  fetchers: IngestionFetcher[];
  normalize: (draft: IngestedPlaceDraft) => IngestedPlaceDraft;
  dedupe: (drafts: IngestedPlaceDraft[]) => IngestedPlaceDraft[];
}

export function createIngestionPipeline(fetchers: IngestionFetcher[]): PlacesIngestionPipeline {
  return {
    fetchers,
    normalize: normalizeIngestedPlace,
    dedupe: dedupeIngestedPlaces,
  };
}

export function normalizeIngestedPlace(draft: IngestedPlaceDraft): IngestedPlaceDraft {
  return {
    ...draft,
    name: draft.name.trim(),
    slugSuggestion: draft.slugSuggestion
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    tags: [...new Set((draft.tags ?? []).map((t) => t.trim().toLowerCase()))],
  };
}

export function dedupeIngestedPlaces(drafts: IngestedPlaceDraft[]): IngestedPlaceDraft[] {
  const byKey = new Map<string, IngestedPlaceDraft>();
  for (const draft of drafts) {
    const key = draft.wikidataId ?? draft.osmId ?? `${draft.source}:${draft.externalId}`;
    if (!byKey.has(key)) byKey.set(key, draft);
  }
  return [...byKey.values()];
}
