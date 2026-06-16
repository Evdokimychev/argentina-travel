import type { IngestedPlaceDraft, IngestionFetcher, IngestionQuery } from "./types";

/**
 * Wikidata SPARQL / EntityData API stub.
 * Use wikidataId in query for entity lookup; SPARQL for bulk Argentina POIs.
 */
export const wikidataFetcher: IngestionFetcher = {
  source: "wikidata",
  async fetch(query: IngestionQuery): Promise<IngestedPlaceDraft[]> {
    if (!query.wikidataId) return [];

    const id = query.wikidataId.replace(/^Q/, "");
    const url = `https://www.wikidata.org/wiki/Special:EntityData/Q${id}.json`;

    try {
      const res = await fetch(url, { next: { revalidate: 86400 } });
      if (!res.ok) return [];

      const data = (await res.json()) as {
        entities?: Record<
          string,
          {
            labels?: { ru?: { value: string }; en?: { value: string } };
            descriptions?: { ru?: { value: string }; en?: { value: string } };
            claims?: Record<string, unknown>;
          }
        >;
      };

      const entity = data.entities?.[`Q${id}`];
      if (!entity) return [];

      const name = entity.labels?.ru?.value ?? entity.labels?.en?.value ?? `Q${id}`;

      return [
        {
          externalId: `Q${id}`,
          source: "wikidata",
          wikidataId: `Q${id}`,
          name,
          slugSuggestion: name,
          shortDescription: entity.descriptions?.ru?.value ?? entity.descriptions?.en?.value,
        },
      ];
    } catch {
      return [];
    }
  },
};
