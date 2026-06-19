import type { SearchResultType } from "@/lib/site-search-index";

export type SearchDocumentRow = {
  id: string;
  slug: string;
  kind: SearchResultType;
  title: string;
  description: string | null;
  body_text: string;
  url: string;
  published_at: string | null;
};

export type SearchHit = {
  id: string;
  kind: SearchResultType;
  kindLabel: string;
  title: string;
  description?: string;
  titleHighlight?: string;
  descriptionHighlight?: string;
  url: string;
  score: number;
};

export type SearchSource = "meilisearch" | "postgres" | "static";

export type SearchResponse = {
  results: SearchHit[];
  source: SearchSource;
  query: string;
  kind?: string;
};

export type ReindexResult = {
  ok: boolean;
  indexed: number;
  removed: number;
  meilisearch?: {
    ok: boolean;
    synced: number;
    removed: number;
    error?: string;
  };
  error?: string;
};
