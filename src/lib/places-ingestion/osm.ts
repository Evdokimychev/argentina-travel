import type { IngestedPlaceDraft, IngestionFetcher, IngestionQuery } from "./types";

/**
 * OpenStreetMap Nominatim search — rate-limited public API.
 * Production ingestion should use self-hosted Nominatim or Overpass for bulk.
 */
export const osmNominatimFetcher: IngestionFetcher = {
  source: "openstreetmap",
  async fetch(query: IngestionQuery): Promise<IngestedPlaceDraft[]> {
    if (!query.name && !query.bbox) return [];

    const params = new URLSearchParams({
      format: "json",
      countrycodes: "ar",
      limit: String(query.limit ?? 10),
    });
    if (query.name) params.set("q", query.name);

    const url = `https://nominatim.openstreetmap.org/search?${params}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ArgentinaTravelPlacesBot/1.0" },
      next: { revalidate: 86400 },
    });

    if (!res.ok) return [];

    const data = (await res.json()) as Array<{
      place_id: number;
      lat: string;
      lon: string;
      display_name: string;
      type?: string;
    }>;

    return data.map((item) => ({
      externalId: String(item.place_id),
      source: "openstreetmap" as const,
      osmId: String(item.place_id),
      name: item.display_name.split(",")[0] ?? item.display_name,
      slugSuggestion: item.display_name.split(",")[0] ?? "place",
      shortDescription: item.display_name,
      latitude: Number.parseFloat(item.lat),
      longitude: Number.parseFloat(item.lon),
      tags: item.type ? [item.type] : [],
    }));
  },
};
