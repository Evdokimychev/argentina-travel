import type { IngestedPlaceDraft, IngestionFetcher, IngestionQuery } from "./types";

/**
 * GeoNames search — requires GEONAMES_USERNAME env for production use.
 * http://www.geonames.org/export/web-services.html
 */
export const geonamesFetcher: IngestionFetcher = {
  source: "geonames",
  async fetch(query: IngestionQuery): Promise<IngestedPlaceDraft[]> {
    const username = process.env.GEONAMES_USERNAME;
    if (!username || !query.name) return [];

    const params = new URLSearchParams({
      q: query.name,
      country: "AR",
      maxRows: String(query.limit ?? 10),
      username,
    });

    const url = `http://api.geonames.org/searchJSON?${params}`;

    try {
      const res = await fetch(url, { next: { revalidate: 86400 } });
      if (!res.ok) return [];

      const data = (await res.json()) as {
        geonames?: Array<{
          geonameId: number;
          name: string;
          lat: string;
          lng: string;
          countryName?: string;
          adminName1?: string;
        }>;
      };

      return (data.geonames ?? []).map((g) => ({
        externalId: String(g.geonameId),
        source: "geonames" as const,
        name: g.name,
        slugSuggestion: g.name,
        latitude: Number.parseFloat(g.lat),
        longitude: Number.parseFloat(g.lng),
        tags: [g.adminName1, g.countryName].filter(Boolean) as string[],
      }));
    } catch {
      return [];
    }
  },
};
