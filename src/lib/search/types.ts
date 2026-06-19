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
  url: string;
  score: number;
};

export type SearchResponse = {
  results: SearchHit[];
  source: "postgres" | "static";
  query: string;
  kind?: string;
};
