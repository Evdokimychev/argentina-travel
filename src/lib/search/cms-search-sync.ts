import type { SupabaseClient } from "@supabase/supabase-js";
import { syncSearchDocumentsToMeilisearch } from "@/lib/search/meilisearch-client";
import type { SearchDocumentRow } from "@/lib/search/types";
import type { SearchIndexItem } from "@/lib/site-search-index";
import type { Database } from "@/types/database";
import type { CmsDocument } from "@/types/cms-content";

type DbClient = SupabaseClient<Database>;

function itemToSearchRow(item: SearchIndexItem, publishedAt: string | null): SearchDocumentRow {
  const slug = item.href.replace(/^\/+/, "").split("/").pop() ?? item.id;
  const bodyText = [item.description ?? "", ...(item.keywords ?? [])].filter(Boolean).join(" ").trim();
  return {
    id: item.id,
    slug,
    kind: item.type,
    title: item.title,
    description: item.description ?? null,
    body_text: bodyText,
    url: item.href,
    published_at: publishedAt,
  };
}

export type CmsSearchSyncAction = "upserted" | "removed" | "skipped";

export type CmsSearchSyncResult = {
  ok: boolean;
  action: CmsSearchSyncAction;
  searchId?: string;
  error?: string;
};

/** Stable search_documents.id for a CMS document (published or not). */
export function cmsDocumentSearchId(doc: Pick<CmsDocument, "docType" | "slug">): string | null {
  switch (doc.docType) {
    case "blog":
      return `blog-${doc.slug}`;
    case "guide":
      return `guide-${doc.slug}`;
    case "legal":
      return `legal-${doc.slug}`;
    case "destination":
      return `destination-page-${doc.slug}`;
    case "place":
      return `place-${doc.slug}`;
    default:
      return null;
  }
}

export function cmsDocumentToSearchIndexItem(doc: CmsDocument): SearchIndexItem | null {
  if (doc.status !== "published") return null;

  const keywords = [doc.slug.replace(/-/g, " ")];

  switch (doc.body.kind) {
    case "blog":
      return {
        id: `blog-${doc.slug}`,
        type: "blog",
        title: doc.title,
        description: doc.seo.description ?? doc.body.excerpt ?? "",
        href: `/blog/${doc.slug}`,
        keywords: [doc.body.excerpt ? "статья" : "", ...keywords].filter(Boolean),
      };
    case "guide":
      return {
        id: `guide-${doc.slug}`,
        type: "guide",
        title: doc.title,
        description: doc.body.description,
        href: `/guide/${doc.slug}`,
        keywords: [doc.body.category ?? "путеводитель", ...keywords],
      };
    case "legal":
      return {
        id: `legal-${doc.slug}`,
        type: "legal",
        title: doc.title,
        description: doc.body.description,
        href: `/legal/${doc.slug}`,
        keywords,
      };
    case "destination":
      return {
        id: `destination-page-${doc.slug}`,
        type: "destination",
        title: doc.title,
        description: doc.body.intro ?? doc.body.description,
        href: `/destinations/${doc.slug}`,
        keywords: [...(doc.body.highlights ?? []), ...keywords],
      };
    case "place":
      return {
        id: `place-${doc.slug}`,
        type: "place",
        title: doc.title,
        description: doc.body.shortDescription,
        href: `/places/${doc.slug}`,
        keywords,
      };
    default:
      return null;
  }
}

/** Upsert or remove a single CMS document in search_documents + Meilisearch. */
export async function syncCmsDocumentToSearchIndex(
  supabase: DbClient,
  doc: CmsDocument
): Promise<CmsSearchSyncResult> {
  const searchId = cmsDocumentSearchId(doc);
  if (!searchId) return { ok: true, action: "skipped" };

  if (doc.status !== "published") {
    const { error } = await supabase.from("search_documents").delete().eq("id", searchId);
    if (error) return { ok: false, action: "skipped", searchId, error: error.message };

    await syncSearchDocumentsToMeilisearch([], [searchId]);
    return { ok: true, action: "removed", searchId };
  }

  const item = cmsDocumentToSearchIndexItem(doc);
  if (!item) return { ok: true, action: "skipped", searchId };

  const row = itemToSearchRow(item, doc.publishedAt);

  const { error } = await supabase.from("search_documents").upsert(row, { onConflict: "id" });
  if (error) return { ok: false, action: "skipped", searchId, error: error.message };

  const meili = await syncSearchDocumentsToMeilisearch([row], []);
  if (!meili.ok) {
    return { ok: false, action: "upserted", searchId, error: meili.error ?? "Meilisearch sync failed" };
  }

  return { ok: true, action: "upserted", searchId };
}
