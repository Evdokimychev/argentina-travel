import type { SupabaseClient } from "@supabase/supabase-js";
import {
  SEARCH_TYPE_LABELS,
  type SearchIndexItem,
  type SearchResultType,
} from "@/lib/site-search-index";
import { searchSiteIndex } from "@/lib/site-search";
import { collectSearchIndexItems } from "@/lib/search/search-indexer";
import {
  isMeilisearchConfigured,
  searchMeilisearchDocuments,
} from "@/lib/search/meilisearch-client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Database } from "@/types/database";
import type { SearchHit, SearchResponse } from "@/lib/search/types";

type DbClient = SupabaseClient<Database>;

const MAX_LIMIT = 20;

type RpcRow = {
  id: string;
  slug: string;
  kind: string;
  title: string;
  description: string | null;
  url: string;
  published_at: string | null;
  rank: number;
};

function isSearchResultType(value: string): value is SearchResultType {
  return value in SEARCH_TYPE_LABELS;
}

function rpcRowToHit(row: RpcRow): SearchHit | null {
  if (!isSearchResultType(row.kind)) return null;
  return {
    id: row.id,
    kind: row.kind,
    kindLabel: SEARCH_TYPE_LABELS[row.kind],
    title: row.title,
    description: row.description ?? undefined,
    url: row.url,
    score: row.rank,
  };
}

function flattenStaticResults(items: SearchIndexItem[], query: string, limit: number): SearchHit[] {
  const groups = searchSiteIndex(items, query, limit);
  const hits: SearchHit[] = [];

  for (const group of groups) {
    for (const item of group.items) {
      if (hits.length >= limit) break;
      hits.push({
        id: item.id,
        kind: item.type,
        kindLabel: group.label,
        title: item.title,
        description: item.description,
        url: item.href,
        score: item.score,
      });
    }
    if (hits.length >= limit) break;
  }

  return hits.slice(0, limit);
}

async function searchPostgres(
  supabase: DbClient,
  query: string,
  kind: string | undefined,
  limit: number
): Promise<SearchHit[]> {
  const { data, error } = await supabase.rpc("search_site_documents", {
    query_text: query,
    filter_kind: kind ?? null,
    result_limit: limit,
  });

  if (error || !data) return [];

  return (data as RpcRow[])
    .map(rpcRowToHit)
    .filter((hit): hit is SearchHit => hit != null);
}

async function searchStatic(query: string, kind: string | undefined, limit: number): Promise<SearchHit[]> {
  const items = await collectSearchIndexItems();
  const filtered =
    kind && isSearchResultType(kind) ? items.filter((item) => item.type === kind) : items;
  return flattenStaticResults(filtered, query, limit);
}

async function searchMeilisearch(
  query: string,
  kind: string | undefined,
  limit: number
): Promise<SearchHit[]> {
  if (!isMeilisearchConfigured()) return [];
  return searchMeilisearchDocuments(query, kind, limit);
}

export async function executeSiteSearch(
  query: string,
  options?: { kind?: string; limit?: number }
): Promise<SearchResponse> {
  const startedAt = Date.now();
  const trimmed = query.trim();
  const kind = options?.kind?.trim() || undefined;
  const limit = Math.min(Math.max(options?.limit ?? MAX_LIMIT, 1), MAX_LIMIT);

  const tookMs = () => Date.now() - startedAt;

  if (!trimmed) {
    const defaultSource = isMeilisearchConfigured()
      ? "meilisearch"
      : isSupabaseConfigured()
        ? "postgres"
        : "static";
    return { results: [], source: defaultSource, query: trimmed, kind, tookMs: tookMs() };
  }

  const meiliResults = await searchMeilisearch(trimmed, kind, limit);
  if (meiliResults.length > 0) {
    return { results: meiliResults, source: "meilisearch", query: trimmed, kind, tookMs: tookMs() };
  }

  if (!isSupabaseConfigured()) {
    const results = await searchStatic(trimmed, kind, limit);
    return { results, source: "static", query: trimmed, kind, tookMs: tookMs() };
  }

  try {
    const supabase = createSupabaseAdminClient();
    let results = await searchPostgres(supabase, trimmed, kind, limit);

    if (results.length === 0) {
      const count = await supabase
        .from("search_documents")
        .select("id", { count: "exact", head: true })
        .then((res) => res.count ?? 0);

      if (count === 0) {
        const { reindexSearchDocuments } = await import("@/lib/search/search-indexer");
        await reindexSearchDocuments(supabase);
        results = await searchPostgres(supabase, trimmed, kind, limit);

        if (results.length === 0 && isMeilisearchConfigured()) {
          const retryMeili = await searchMeilisearch(trimmed, kind, limit);
          if (retryMeili.length > 0) {
            return {
              results: retryMeili,
              source: "meilisearch",
              query: trimmed,
              kind,
              tookMs: tookMs(),
            };
          }
        }
      }
    }

    if (results.length > 0) {
      return { results, source: "postgres", query: trimmed, kind, tookMs: tookMs() };
    }

    const fallback = await searchStatic(trimmed, kind, limit);
    return { results: fallback, source: "static", query: trimmed, kind, tookMs: tookMs() };
  } catch {
    const fallback = await searchStatic(trimmed, kind, limit);
    return { results: fallback, source: "static", query: trimmed, kind, tookMs: tookMs() };
  }
}
