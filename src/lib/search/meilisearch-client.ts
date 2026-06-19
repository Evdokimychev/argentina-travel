import {
  SEARCH_TYPE_LABELS,
  type SearchResultType,
} from "@/lib/site-search-index";
import type { SearchDocumentRow, SearchHit } from "@/lib/search/types";

const INDEX_UID = "site";
const UPSERT_BATCH = 100;

const HIGHLIGHT_PRE = "<mark>";
const HIGHLIGHT_POST = "</mark>";

export type MeilisearchSyncResult = {
  ok: boolean;
  synced: number;
  removed: number;
  error?: string;
};

type MeilisearchHit = {
  id: string;
  kind: string;
  title: string;
  description?: string | null;
  url: string;
  _formatted?: {
    title?: string;
    description?: string;
    body_text?: string;
  };
  _rankingScore?: number;
};

function isSearchResultType(value: string): value is SearchResultType {
  return value in SEARCH_TYPE_LABELS;
}

export function isMeilisearchConfigured(): boolean {
  return Boolean(
    process.env.MEILISEARCH_HOST?.trim() && process.env.MEILISEARCH_API_KEY?.trim()
  );
}

async function getMeilisearchIndex() {
  if (!isMeilisearchConfigured()) return null;

  const host = process.env.MEILISEARCH_HOST!.trim();
  const apiKey = process.env.MEILISEARCH_API_KEY!.trim();

  const { MeiliSearch } = await import("meilisearch");
  const client = new MeiliSearch({ host, apiKey });
  return client.index(INDEX_UID);
}

function meiliHitToSearchHit(hit: MeilisearchHit): SearchHit | null {
  if (!isSearchResultType(hit.kind)) return null;

  const formatted = hit._formatted;
  const description =
    formatted?.description ?? formatted?.body_text ?? hit.description ?? undefined;

  return {
    id: hit.id,
    kind: hit.kind,
    kindLabel: SEARCH_TYPE_LABELS[hit.kind],
    title: hit.title,
    description: hit.description ?? undefined,
    titleHighlight: formatted?.title,
    descriptionHighlight: description,
    url: hit.url,
    score: hit._rankingScore ?? 1,
  };
}

export async function ensureMeilisearchIndexSettings(): Promise<void> {
  const index = await getMeilisearchIndex();
  if (!index) return;

  await index.updateSettings({
    searchableAttributes: ["title", "body_text", "description"],
    filterableAttributes: ["kind"],
    displayedAttributes: ["id", "slug", "kind", "title", "description", "body_text", "url", "published_at"],
  });
}

export async function syncSearchDocumentsToMeilisearch(
  rows: SearchDocumentRow[],
  removedIds: string[] = []
): Promise<MeilisearchSyncResult> {
  if (!isMeilisearchConfigured()) {
    return { ok: true, synced: 0, removed: 0 };
  }

  try {
    const index = await getMeilisearchIndex();
    if (!index) {
      return { ok: true, synced: 0, removed: 0 };
    }

    await ensureMeilisearchIndexSettings();

    let synced = 0;
    for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
      const batch = rows.slice(i, i + UPSERT_BATCH);
      const task = await index.addDocuments(batch, { primaryKey: "id" });
      if (task.taskUid != null) {
        await index.waitForTask(task.taskUid);
      }
      synced += batch.length;
    }

    let removed = 0;
    if (removedIds.length > 0) {
      for (let i = 0; i < removedIds.length; i += UPSERT_BATCH) {
        const batch = removedIds.slice(i, i + UPSERT_BATCH);
        const task = await index.deleteDocuments(batch);
        if (task.taskUid != null) {
          await index.waitForTask(task.taskUid);
        }
        removed += batch.length;
      }
    }

    return { ok: true, synced, removed };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Meilisearch sync failed";
    return { ok: false, synced: 0, removed: 0, error: message };
  }
}

export async function searchMeilisearchDocuments(
  query: string,
  kind: string | undefined,
  limit: number
): Promise<SearchHit[]> {
  if (!isMeilisearchConfigured()) return [];

  try {
    const index = await getMeilisearchIndex();
    if (!index) return [];

    const filter = kind && isSearchResultType(kind) ? `kind = "${kind}"` : undefined;

    const response = await index.search<MeilisearchHit>(query, {
      limit,
      filter,
      attributesToHighlight: ["title", "description", "body_text"],
      attributesToCrop: ["description", "body_text"],
      cropLength: 140,
      cropMarker: "…",
      highlightPreTag: HIGHLIGHT_PRE,
      highlightPostTag: HIGHLIGHT_POST,
      showRankingScore: true,
    });

    return response.hits
      .map(meiliHitToSearchHit)
      .filter((hit): hit is SearchHit => hit != null);
  } catch {
    return [];
  }
}
