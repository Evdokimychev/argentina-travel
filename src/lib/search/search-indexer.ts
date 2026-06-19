import type { SupabaseClient } from "@supabase/supabase-js";
import { buildExcursionSearchItems } from "@/lib/excursion-search-index";
import {
  buildStaticSearchIndexServer,
  buildTourSearchItems,
  type SearchIndexItem,
} from "@/lib/site-search-index";
import { fetchPublishedListings } from "@/lib/tour-content-server";
import { fetchExcursionsServer } from "@/lib/tripster/excursion-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Database } from "@/types/database";
import { syncSearchDocumentsToMeilisearch } from "@/lib/search/meilisearch-client";
import type { ReindexResult, SearchDocumentRow } from "@/lib/search/types";

type DbClient = SupabaseClient<Database>;

function slugFromItem(item: SearchIndexItem): string {
  const fromHref = item.href.replace(/^\/+/, "").split("/").pop();
  if (fromHref) return fromHref;
  const parts = item.id.split("-");
  return parts.length > 1 ? parts.slice(1).join("-") : item.id;
}

function bodyTextFromItem(item: SearchIndexItem): string {
  const parts = [item.description ?? "", ...(item.keywords ?? [])];
  return parts.filter(Boolean).join(" ").trim();
}

export function searchIndexItemToRow(item: SearchIndexItem): Omit<SearchDocumentRow, "published_at"> & {
  published_at: string | null;
} {
  return {
    id: item.id,
    slug: slugFromItem(item),
    kind: item.type,
    title: item.title,
    description: item.description ?? null,
    body_text: bodyTextFromItem(item),
    url: item.href,
    published_at: null,
  };
}

export async function collectSearchIndexItems(): Promise<SearchIndexItem[]> {
  const [staticItems, tours, excursionsResult] = await Promise.all([
    buildStaticSearchIndexServer(),
    collectTourItems(),
    fetchExcursionsServer({ pageSize: 500 }).catch(() => ({ items: [] as never[], cities: [] })),
  ]);

  const excursionItems = buildExcursionSearchItems(excursionsResult.items);

  const byId = new Map<string, SearchIndexItem>();
  for (const item of [...tours, ...excursionItems, ...staticItems]) {
    byId.set(item.id, item);
  }

  return [...byId.values()];
}

async function collectTourItems(): Promise<SearchIndexItem[]> {
  if (!isSupabaseConfigured()) {
    const { getMarketplaceListings } = await import("@/lib/tour-repository");
    return buildTourSearchItems(getMarketplaceListings());
  }

  try {
    const supabase = createSupabaseAdminClient();
    const listings = await fetchPublishedListings(supabase);
    if (listings.length > 0) {
      return buildTourSearchItems(listings);
    }
  } catch {
    // fall through to local repository
  }

  const { getMarketplaceListings } = await import("@/lib/tour-repository");
  return buildTourSearchItems(getMarketplaceListings());
}

const UPSERT_BATCH = 100;

export async function reindexSearchDocuments(
  supabase: DbClient = createSupabaseAdminClient()
): Promise<ReindexResult> {
  try {
    const items = await collectSearchIndexItems();
    const rows = items.map(searchIndexItemToRow);
    const ids = new Set(rows.map((row) => row.id));

    for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
      const batch = rows.slice(i, i + UPSERT_BATCH);
      const { error } = await supabase.from("search_documents").upsert(batch, { onConflict: "id" });
      if (error) {
        return { ok: false, indexed: 0, removed: 0, error: error.message };
      }
    }

    const { data: existing, error: listError } = await supabase.from("search_documents").select("id");
    if (listError) {
      return { ok: false, indexed: rows.length, removed: 0, error: listError.message };
    }

    const staleIds = (existing ?? []).map((row) => row.id).filter((id) => !ids.has(id));
    let removed = 0;

    if (staleIds.length > 0) {
      for (let i = 0; i < staleIds.length; i += UPSERT_BATCH) {
        const batch = staleIds.slice(i, i + UPSERT_BATCH);
        const { error } = await supabase.from("search_documents").delete().in("id", batch);
        if (error) {
          return { ok: false, indexed: rows.length, removed, error: error.message };
        }
        removed += batch.length;
      }
    }

    const meilisearch = await syncSearchDocumentsToMeilisearch(rows, staleIds);

    return { ok: true, indexed: rows.length, removed, meilisearch };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reindex failed";
    return { ok: false, indexed: 0, removed: 0, error: message };
  }
}
