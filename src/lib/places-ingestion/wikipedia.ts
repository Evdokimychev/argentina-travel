import type { IngestedPlaceDraft, IngestionFetcher, IngestionQuery } from "./types";

/**
 * Wikipedia REST API — summary extract for place names.
 * https://en.wikipedia.org/api/rest_v1/
 */
export const wikipediaFetcher: IngestionFetcher = {
  source: "wikipedia",
  async fetch(query: IngestionQuery): Promise<IngestedPlaceDraft[]> {
    if (!query.name) return [];

    const title = encodeURIComponent(query.name.replace(/ /g, "_"));
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`;

    try {
      const res = await fetch(url, { next: { revalidate: 86400 } });
      if (!res.ok) return [];

      const data = (await res.json()) as {
        title: string;
        extract?: string;
        description?: string;
        content_urls?: { desktop?: { page?: string } };
        thumbnail?: { source?: string };
        coordinates?: { lat?: number; lon?: number };
      };

      return [
        {
          externalId: data.title,
          source: "wikipedia",
          name: data.title,
          slugSuggestion: data.title,
          shortDescription: data.description,
          fullDescription: data.extract,
          website: data.content_urls?.desktop?.page,
          coverImage: data.thumbnail?.source,
          latitude: data.coordinates?.lat,
          longitude: data.coordinates?.lon,
        },
      ];
    } catch {
      return [];
    }
  },
};
