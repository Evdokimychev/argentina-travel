import type { SupabaseClient } from "@supabase/supabase-js";
import { rowToCmsDocument, rowToCmsRevision, cmsDocumentToRow } from "@/lib/cms/content-mapper";
import type { Database, Json } from "@/types/database";
import type {
  CmsDocType,
  CmsDocument,
  CmsDocumentBody,
  CmsDocumentSeo,
  CmsDocumentStatus,
  CmsRevision,
} from "@/types/cms-content";
import { cmsDocumentId } from "@/types/cms-content";
import { validateScheduledPublishAt } from "@/lib/cms/cms-scheduled-publish";
import { syncCmsDocumentToSearchIndex } from "@/lib/search/cms-search-sync";

type DbClient = SupabaseClient<Database>;

async function syncSearchAfterCmsDocumentChange(
  supabase: DbClient,
  document: CmsDocument
): Promise<void> {
  try {
    await syncCmsDocumentToSearchIndex(supabase, document);
  } catch {
    // Search sync must not block CMS publish/save.
  }
}

export async function listCmsDocuments(
  supabase: DbClient,
  options?: { docType?: CmsDocType; status?: CmsDocumentStatus }
): Promise<CmsDocument[]> {
  let query = supabase.from("content_documents").select("*").order("updated_at", { ascending: false });

  if (options?.docType) query = query.eq("doc_type", options.docType);
  if (options?.status) query = query.eq("status", options.status);

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(rowToCmsDocument);
}

export async function getCmsDocumentById(
  supabase: DbClient,
  id: string
): Promise<CmsDocument | null> {
  const { data, error } = await supabase
    .from("content_documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return rowToCmsDocument(data);
}

export async function createCmsDocument(
  supabase: DbClient,
  input: {
    docType: CmsDocType;
    slug: string;
    locale?: string;
    title: string;
    body: CmsDocumentBody;
    seo?: CmsDocumentSeo;
    status?: CmsDocumentStatus;
    actorId: string;
  }
): Promise<{ document: CmsDocument } | { error: string }> {
  const locale = input.locale ?? "ru";
  const id = cmsDocumentId(input.docType, input.slug, locale);

  const existing = await getCmsDocumentById(supabase, id);
  if (existing) return { error: "Документ с таким id уже существует" };

  const row = cmsDocumentToRow({
    id,
    docType: input.docType,
    slug: input.slug,
    locale,
    title: input.title,
    status: input.status ?? "draft",
    body: input.body,
    seo: input.seo ?? {},
    publishedAt: null,
    scheduledPublishAt: null,
    createdBy: input.actorId,
    updatedBy: input.actorId,
  });

  const { error } = await supabase.from("content_documents").insert(row);
  if (error) return { error: error.message };

  const document = await getCmsDocumentById(supabase, id);
  if (!document) return { error: "Не удалось прочитать созданный документ" };

  await appendCmsRevision(supabase, document, input.actorId, 1);
  return { document };
}

async function nextRevisionNumber(supabase: DbClient, documentId: string): Promise<number> {
  const { data } = await supabase
    .from("content_revisions")
    .select("revision_number")
    .eq("document_id", documentId)
    .order("revision_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.revision_number ?? 0) + 1;
}

async function appendCmsRevision(
  supabase: DbClient,
  doc: CmsDocument,
  actorId: string | null,
  revisionNumber?: number
): Promise<void> {
  const revNum = revisionNumber ?? (await nextRevisionNumber(supabase, doc.id));
  await supabase.from("content_revisions").insert({
    document_id: doc.id,
    revision_number: revNum,
    title: doc.title,
    body: doc.body as Json,
    seo: doc.seo as Json,
    created_by: actorId,
  });
}

export async function updateCmsDocument(
  supabase: DbClient,
  id: string,
  input: {
    title?: string;
    body?: CmsDocumentBody;
    seo?: CmsDocumentSeo;
    status?: CmsDocumentStatus;
    actorId: string;
  }
): Promise<{ document: CmsDocument } | { error: string }> {
  const current = await getCmsDocumentById(supabase, id);
  if (!current) return { error: "Документ не найден" };

  const update: Database["public"]["Tables"]["content_documents"]["Update"] = {
    updated_by: input.actorId,
  };

  if (input.title !== undefined) update.title = input.title;
  if (input.body !== undefined) update.body = input.body as Json;
  if (input.seo !== undefined) update.seo = input.seo as Json;
  if (input.status !== undefined) {
    update.status = input.status;
    if (input.status === "published") {
      update.published_at = new Date().toISOString();
      update.scheduled_publish_at = null;
    } else if (input.status === "draft" || input.status === "archived") {
      update.scheduled_publish_at = null;
    }
  }

  const { error } = await supabase.from("content_documents").update(update).eq("id", id);
  if (error) return { error: error.message };

  const document = await getCmsDocumentById(supabase, id);
  if (!document) return { error: "Не удалось прочитать документ" };

  await appendCmsRevision(supabase, document, input.actorId);
  await syncSearchAfterCmsDocumentChange(supabase, document);
  return { document };
}

export async function publishCmsDocument(
  supabase: DbClient,
  id: string,
  actorId: string
): Promise<{ document: CmsDocument } | { error: string }> {
  return updateCmsDocument(supabase, id, { status: "published", actorId });
}

export async function scheduleCmsDocument(
  supabase: DbClient,
  id: string,
  input: {
    scheduledPublishAt: string;
    title?: string;
    body?: CmsDocumentBody;
    seo?: CmsDocumentSeo;
    actorId: string;
  }
): Promise<{ document: CmsDocument } | { error: string }> {
  const validated = validateScheduledPublishAt(input.scheduledPublishAt);
  if (!validated.ok) return { error: validated.error };

  const current = await getCmsDocumentById(supabase, id);
  if (!current) return { error: "Документ не найден" };
  if (current.status === "published") {
    return { error: "Опубликованный документ нельзя запланировать — сначала снимите с публикации" };
  }

  const update: Database["public"]["Tables"]["content_documents"]["Update"] = {
    status: "scheduled",
    scheduled_publish_at: validated.iso,
    updated_by: input.actorId,
  };

  if (input.title !== undefined) update.title = input.title;
  if (input.body !== undefined) update.body = input.body as Json;
  if (input.seo !== undefined) update.seo = input.seo as Json;

  const { error } = await supabase.from("content_documents").update(update).eq("id", id);
  if (error) return { error: error.message };

  const document = await getCmsDocumentById(supabase, id);
  if (!document) return { error: "Не удалось прочитать документ" };

  await appendCmsRevision(supabase, document, input.actorId);
  return { document };
}

export async function cancelCmsDocumentSchedule(
  supabase: DbClient,
  id: string,
  actorId: string
): Promise<{ document: CmsDocument } | { error: string }> {
  const current = await getCmsDocumentById(supabase, id);
  if (!current) return { error: "Документ не найден" };
  if (current.status !== "scheduled") {
    return { error: "У документа нет запланированной публикации" };
  }

  const { error } = await supabase
    .from("content_documents")
    .update({
      status: "draft",
      scheduled_publish_at: null,
      updated_by: actorId,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  const document = await getCmsDocumentById(supabase, id);
  if (!document) return { error: "Не удалось прочитать документ" };

  await appendCmsRevision(supabase, document, actorId);
  return { document };
}

export type PublishScheduledCmsResult = {
  publishedIds: string[];
  failed: Array<{ id: string; error: string }>;
};

export async function publishDueScheduledCmsDocuments(
  supabase: DbClient,
  actorId: string | null = null
): Promise<PublishScheduledCmsResult> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("content_documents")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_publish_at", now);

  if (error || !data?.length) {
    return { publishedIds: [], failed: error ? [{ id: "*", error: error.message }] : [] };
  }

  const publishedIds: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  for (const row of data) {
    const current = await getCmsDocumentById(supabase, row.id);
    if (!current || current.status !== "scheduled" || !current.scheduledPublishAt) continue;

    const publishAt = current.scheduledPublishAt;
    const { error: updateError } = await supabase
      .from("content_documents")
      .update({
        status: "published",
        published_at: publishAt,
        scheduled_publish_at: null,
        updated_by: actorId,
      })
      .eq("id", row.id);

    if (updateError) {
      failed.push({ id: row.id, error: updateError.message });
      continue;
    }

    const document = await getCmsDocumentById(supabase, row.id);
    if (document) {
      await appendCmsRevision(supabase, document, actorId);
      await syncSearchAfterCmsDocumentChange(supabase, document);
    }
    publishedIds.push(row.id);
  }

  return { publishedIds, failed };
}

export async function deleteCmsDocument(
  supabase: DbClient,
  id: string
): Promise<{ ok: true } | { error: string }> {
  const { error } = await supabase.from("content_documents").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function listCmsRevisions(
  supabase: DbClient,
  documentId: string
): Promise<CmsRevision[]> {
  const { data, error } = await supabase
    .from("content_revisions")
    .select("*")
    .eq("document_id", documentId)
    .order("revision_number", { ascending: false })
    .limit(30);

  if (error || !data) return [];
  return data.map(rowToCmsRevision);
}

export async function getCmsRevisionById(
  supabase: DbClient,
  documentId: string,
  revisionId: string
): Promise<CmsRevision | null> {
  const { data, error } = await supabase
    .from("content_revisions")
    .select("*")
    .eq("document_id", documentId)
    .eq("id", revisionId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToCmsRevision(data);
}

export async function restoreCmsDocumentFromRevision(
  supabase: DbClient,
  documentId: string,
  revisionId: string,
  input: {
    actorId: string;
    publish?: boolean;
  }
): Promise<{ document: CmsDocument; restoredRevision: CmsRevision } | { error: string }> {
  const revision = await getCmsRevisionById(supabase, documentId, revisionId);
  if (!revision) return { error: "Ревизия не найдена" };

  const result = await updateCmsDocument(supabase, documentId, {
    title: revision.title,
    body: revision.body,
    seo: revision.seo,
    status: input.publish ? "published" : "draft",
    actorId: input.actorId,
  });

  if ("error" in result) return result;
  return { document: result.document, restoredRevision: revision };
}
