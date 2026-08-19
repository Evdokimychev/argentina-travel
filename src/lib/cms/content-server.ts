import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { rowToCmsDocument, rowToCmsRevision } from "@/lib/cms/content-mapper";
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
import {
  describeCmsKnowledgePublicationIssues,
  getCmsKnowledgePublicationIssues,
} from "@/lib/cms/knowledge-resolver";
import { syncCmsDocumentToSearchIndex } from "@/lib/search/cms-search-sync";
import { revalidateCmsPublicSurfaces } from "@/lib/cms/cms-public-revalidate";

type DbClient = SupabaseClient<Database>;

export type CmsMutationErrorCode =
  | "STALE_VERSION"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "CONFLICT"
  | "INVALID"
  | "FAILED";

type CmsMutationFailure = { error: string; code: CmsMutationErrorCode };

export function cmsMutationHttpStatus(code: CmsMutationErrorCode): number {
  if (code === "STALE_VERSION" || code === "CONFLICT") return 409;
  if (code === "NOT_FOUND") return 404;
  if (code === "FORBIDDEN") return 403;
  if (code === "INVALID") return 400;
  return 500;
}

function actorUuid(actorId: string | null): string | null {
  return actorId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(actorId)
    ? actorId
    : null;
}

function cmsFailure(error: { code?: string; message?: string } | null): CmsMutationFailure {
  const message = error?.message ?? "CMS_OPERATION_FAILED";
  if (error?.code === "40001" || message.includes("CMS_STALE_VERSION")) {
    return {
      error: "Материал уже изменён в другой вкладке. Обновите страницу и повторите действие.",
      code: "STALE_VERSION",
    };
  }
  if (error?.code === "P0002" || message.includes("NOT_FOUND")) {
    return { error: "Документ или выбранная ревизия не найдены", code: "NOT_FOUND" };
  }
  if (error?.code === "42501" || message.includes("PERMISSION_REQUIRED")) {
    return { error: "Для этого действия нужно право публикации материалов", code: "FORBIDDEN" };
  }
  if (error?.code === "23505" || message.includes("ALREADY_EXISTS") || message.includes("CONFLICT")) {
    return {
      error: message.includes("IMPORT_OPERATION")
        ? "Этот идентификатор импорта уже использован для другого набора материалов"
        : "Документ с таким адресом уже существует",
      code: "CONFLICT",
    };
  }
  if (error?.code === "22023" || message.startsWith("CMS_")) {
    const ownerMessage = message.includes("SCHEDULE")
      ? "Проверьте дату публикации: она должна быть в будущем"
      : "Не удалось выполнить действие: проверьте заполненные поля";
    return { error: ownerMessage, code: "INVALID" };
  }
  return { error: "Не удалось сохранить материал. Повторите попытку.", code: "FAILED" };
}

function isCmsPublicStatus(status: CmsDocumentStatus): boolean {
  return status === "published" || status === "scheduled";
}

function cmsKnowledgePublicationFailure(document: CmsDocument): CmsMutationFailure | null {
  if (document.docType !== "knowledge" || !isCmsPublicStatus(document.status)) return null;
  const issues = getCmsKnowledgePublicationIssues(document);
  if (issues.length === 0) return null;
  return {
    error: `Материал базы знаний пока нельзя опубликовать: ${describeCmsKnowledgePublicationIssues(issues)}. Исправьте эти пункты и повторите публикацию.`,
    code: "INVALID",
  };
}

async function validateExistingKnowledgePublicMutation(
  supabase: DbClient,
  id: string,
  expectedVersion: number,
  patch: Partial<Pick<CmsDocument, "title" | "body" | "seo" | "status">>,
): Promise<CmsMutationFailure | null> {
  const current = await getCmsDocumentById(supabase, id);
  if (!current) return { error: "Документ не найден", code: "NOT_FOUND" };
  if (current.rowVersion !== expectedVersion) {
    return {
      error: "Материал уже изменён в другой вкладке. Обновите страницу и повторите действие.",
      code: "STALE_VERSION",
    };
  }
  if (current.docType !== "knowledge") return null;
  const candidate: CmsDocument = { ...current, ...patch };
  return cmsKnowledgePublicationFailure(candidate);
}

function documentFromRpc(value: Json | undefined): CmsDocument | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const document = (value as Record<string, Json | undefined>).document;
  if (!document || typeof document !== "object" || Array.isArray(document)) return null;
  return rowToCmsDocument(
    document as Database["public"]["Tables"]["content_documents"]["Row"]
  );
}

function settleCmsPublicCache(document: CmsDocument): void {
  revalidateCmsPublicSurfaces({ docType: document.docType, slug: document.slug });
}

async function settleCmsSearchIntent(
  supabase: DbClient,
  document: CmsDocument
): Promise<void> {
  const match = supabase
    .from("cms_search_outbox")
    .update({ status: "processing", attempts: 1, last_error: null })
    .eq("document_id", document.id)
    .eq("document_version", document.rowVersion)
    .in("status", ["pending", "failed"]);
  try {
    await match;
    const result = await syncCmsDocumentToSearchIndex(supabase, document);
    await supabase
      .from("cms_search_outbox")
      .update(
        result.ok
          ? { status: "completed", completed_at: new Date().toISOString(), last_error: null }
          : { status: "failed", last_error: result.error ?? "Поиск временно недоступен" }
      )
      .eq("document_id", document.id)
      .eq("document_version", document.rowVersion);
  } catch (error) {
    await supabase
      .from("cms_search_outbox")
      .update({
        status: "failed",
        last_error: error instanceof Error ? error.message.slice(0, 500) : "Поиск временно недоступен",
      })
      .eq("document_id", document.id)
      .eq("document_version", document.rowVersion);
  }
}

export async function processPendingCmsSearchIntents(
  supabase: DbClient,
  limit = 50,
): Promise<{ processed: number; failed: number }> {
  const { data } = await supabase
    .from("cms_search_outbox")
    .select("id, document_id, document_version, document_snapshot, attempts")
    .in("status", ["pending", "failed"])
    .lte("next_attempt_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(Math.max(1, Math.min(limit, 100)));
  if (!data?.length) return { processed: 0, failed: 0 };

  let processed = 0;
  let failed = 0;
  for (const intent of data) {
    const current = await getCmsDocumentById(supabase, intent.document_id);
    if (current && current.rowVersion !== intent.document_version) {
      await supabase
        .from("cms_search_outbox")
        .update({ status: "completed", completed_at: new Date().toISOString(), last_error: "superseded" })
        .eq("id", intent.id);
      processed += 1;
      continue;
    }

    const snapshot = rowToCmsDocument(
      intent.document_snapshot as Database["public"]["Tables"]["content_documents"]["Row"]
    );
    await supabase
      .from("cms_search_outbox")
      .update({ status: "processing", attempts: intent.attempts + 1, last_error: null })
      .eq("id", intent.id)
      .in("status", ["pending", "failed"]);
    try {
      const result = await syncCmsDocumentToSearchIndex(supabase, current ?? snapshot);
      if (!result.ok) throw new Error(result.error ?? "Поиск временно недоступен");
      await supabase
        .from("cms_search_outbox")
        .update({ status: "completed", completed_at: new Date().toISOString(), last_error: null })
        .eq("id", intent.id);
      processed += 1;
    } catch (error) {
      const delayMinutes = Math.min(60, 2 ** Math.min(intent.attempts, 5));
      await supabase
        .from("cms_search_outbox")
        .update({
          status: "failed",
          last_error: error instanceof Error ? error.message.slice(0, 500) : "Поиск временно недоступен",
          next_attempt_at: new Date(Date.now() + delayMinutes * 60_000).toISOString(),
        })
        .eq("id", intent.id);
      failed += 1;
    }
  }
  return { processed, failed };
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
    actorId: string | null;
    allowPublish?: boolean;
    ipAddress?: string | null;
  }
): Promise<{ document: CmsDocument } | CmsMutationFailure> {
  const locale = input.locale ?? "ru";
  const id = cmsDocumentId(input.docType, input.slug, locale);
  const status = input.status ?? "draft";
  if (isCmsPublicStatus(status)) {
    const now = new Date().toISOString();
    const validation = cmsKnowledgePublicationFailure({
      id,
      docType: input.docType,
      slug: input.slug,
      locale,
      title: input.title,
      status,
      body: input.body,
      seo: input.seo ?? {},
      publishedAt: status === "published" ? now : null,
      scheduledPublishAt: null,
      createdBy: input.actorId,
      updatedBy: input.actorId,
      rowVersion: 0,
      createdAt: now,
      updatedAt: now,
    });
    if (validation) return validation;
  }

  const { data, error } = await supabase.rpc("cms_create_document_atomic", {
    p_document_id: id,
    p_doc_type: input.docType,
    p_slug: input.slug,
    p_locale: locale,
    p_title: input.title,
    p_body: input.body as Json,
    p_seo: (input.seo ?? {}) as Json,
    p_status: status,
    p_actor_id: actorUuid(input.actorId),
    p_allow_publish: input.allowPublish === true,
    p_ip_address: input.ipAddress ?? null,
  });
  if (error) return cmsFailure(error);
  const document = documentFromRpc(data);
  if (!document) return { error: "Не удалось прочитать созданный документ", code: "FAILED" };
  if (document.status === "published") {
    await settleCmsSearchIntent(supabase, document);
    settleCmsPublicCache(document);
  }
  return { document };
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
    expectedVersion: number;
    allowPublish?: boolean;
    ipAddress?: string | null;
  }
): Promise<{ document: CmsDocument } | CmsMutationFailure> {
  const validation = await validateExistingKnowledgePublicMutation(
    supabase,
    id,
    input.expectedVersion,
    {
      ...(input.title === undefined ? {} : { title: input.title }),
      ...(input.body === undefined ? {} : { body: input.body }),
      ...(input.seo === undefined ? {} : { seo: input.seo }),
      ...(input.status === undefined ? {} : { status: input.status }),
    },
  );
  if (validation) return validation;

  const { data, error } = await supabase.rpc("cms_mutate_document_atomic", {
    p_document_id: id,
    p_expected_version: input.expectedVersion,
    p_actor_id: actorUuid(input.actorId),
    p_operation: "update",
    p_allow_publish: input.allowPublish === true,
    p_title: input.title ?? null,
    p_body: input.body === undefined ? null : (input.body as Json),
    p_seo: input.seo === undefined ? null : (input.seo as Json),
    p_target_status: input.status ?? null,
    p_scheduled_publish_at: null,
    p_restore_revision_id: null,
    p_ip_address: input.ipAddress ?? null,
  });
  if (error) return cmsFailure(error);
  const document = documentFromRpc(data);
  if (!document) return { error: "Не удалось прочитать документ", code: "FAILED" };
  await settleCmsSearchIntent(supabase, document);
  settleCmsPublicCache(document);
  return { document };
}

export async function unpublishCmsDocument(
  supabase: DbClient,
  id: string,
  input: { actorId: string; expectedVersion: number; ipAddress?: string | null }
): Promise<{ document: CmsDocument } | CmsMutationFailure> {
  return updateCmsDocument(supabase, id, {
    status: "draft",
    actorId: input.actorId,
    expectedVersion: input.expectedVersion,
    allowPublish: true,
    ipAddress: input.ipAddress,
  });
}

export async function archiveCmsDocument(
  supabase: DbClient,
  id: string,
  input: { actorId: string; expectedVersion: number; ipAddress?: string | null }
): Promise<{ document: CmsDocument } | CmsMutationFailure> {
  return updateCmsDocument(supabase, id, {
    status: "archived",
    actorId: input.actorId,
    expectedVersion: input.expectedVersion,
    allowPublish: true,
    ipAddress: input.ipAddress,
  });
}

export async function publishCmsDocument(
  supabase: DbClient,
  id: string,
  input: { actorId: string; expectedVersion: number; ipAddress?: string | null }
): Promise<{ document: CmsDocument } | CmsMutationFailure> {
  const validation = await validateExistingKnowledgePublicMutation(
    supabase,
    id,
    input.expectedVersion,
    { status: "published" },
  );
  if (validation) return validation;

  const { data, error } = await supabase.rpc("cms_mutate_document_atomic", {
    p_document_id: id,
    p_expected_version: input.expectedVersion,
    p_actor_id: actorUuid(input.actorId),
    p_operation: "publish",
    p_allow_publish: true,
    p_ip_address: input.ipAddress ?? null,
  });
  if (error) return cmsFailure(error);
  const document = documentFromRpc(data);
  if (!document) return { error: "Не удалось прочитать документ", code: "FAILED" };
  await settleCmsSearchIntent(supabase, document);
  settleCmsPublicCache(document);
  return { document };
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
    expectedVersion: number;
    ipAddress?: string | null;
  }
): Promise<{ document: CmsDocument } | CmsMutationFailure> {
  const validated = validateScheduledPublishAt(input.scheduledPublishAt);
  if (!validated.ok) return { error: validated.error, code: "INVALID" };
  const publicationValidation = await validateExistingKnowledgePublicMutation(
    supabase,
    id,
    input.expectedVersion,
    {
      status: "scheduled",
      ...(input.title === undefined ? {} : { title: input.title }),
      ...(input.body === undefined ? {} : { body: input.body }),
      ...(input.seo === undefined ? {} : { seo: input.seo }),
    },
  );
  if (publicationValidation) return publicationValidation;

  const { data, error } = await supabase.rpc("cms_mutate_document_atomic", {
    p_document_id: id,
    p_expected_version: input.expectedVersion,
    p_actor_id: actorUuid(input.actorId),
    p_operation: "schedule",
    p_allow_publish: true,
    p_title: input.title ?? null,
    p_body: input.body === undefined ? null : (input.body as Json),
    p_seo: input.seo === undefined ? null : (input.seo as Json),
    p_scheduled_publish_at: validated.iso,
    p_ip_address: input.ipAddress ?? null,
  });
  if (error) return cmsFailure(error);
  const document = documentFromRpc(data);
  if (!document) return { error: "Не удалось прочитать документ", code: "FAILED" };
  await settleCmsSearchIntent(supabase, document);
  settleCmsPublicCache(document);
  return { document };
}

export async function cancelCmsDocumentSchedule(
  supabase: DbClient,
  id: string,
  input: { actorId: string; expectedVersion: number; ipAddress?: string | null }
): Promise<{ document: CmsDocument } | CmsMutationFailure> {
  const { data, error } = await supabase.rpc("cms_mutate_document_atomic", {
    p_document_id: id,
    p_expected_version: input.expectedVersion,
    p_actor_id: actorUuid(input.actorId),
    p_operation: "unschedule",
    p_allow_publish: true,
    p_ip_address: input.ipAddress ?? null,
  });
  if (error) return cmsFailure(error);
  const document = documentFromRpc(data);
  if (!document) return { error: "Не удалось прочитать документ", code: "FAILED" };
  await settleCmsSearchIntent(supabase, document);
  settleCmsPublicCache(document);
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
  const { data, error } = await supabase
    .from("content_documents")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_publish_at", new Date().toISOString())
    .order("scheduled_publish_at", { ascending: true })
    .limit(100);
  if (error) {
    return { publishedIds: [], failed: [{ id: "*", error: cmsFailure(error).error }] };
  }

  const publishedIds: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];
  for (const row of data ?? []) {
    const scheduled = rowToCmsDocument(row);
    const validation = cmsKnowledgePublicationFailure(scheduled);
    if (validation) {
      failed.push({ id: scheduled.id, error: validation.error });
      continue;
    }

    const { data: mutationData, error: mutationError } = await supabase.rpc(
      "cms_mutate_document_atomic",
      {
        p_document_id: scheduled.id,
        p_expected_version: scheduled.rowVersion,
        p_actor_id: actorUuid(actorId),
        p_operation: "publish_scheduled",
        p_allow_publish: true,
      },
    );
    if (mutationError) {
      failed.push({ id: scheduled.id, error: cmsFailure(mutationError).error });
      continue;
    }
    const document = documentFromRpc(mutationData);
    if (!document) {
      failed.push({ id: scheduled.id, error: "Не удалось прочитать опубликованный документ" });
      continue;
    }
    publishedIds.push(document.id);
    await settleCmsSearchIntent(supabase, document);
    settleCmsPublicCache(document);
  }
  await processPendingCmsSearchIntents(supabase);
  return { publishedIds, failed };
}

export async function deleteCmsDocument(
  supabase: DbClient,
  id: string
): Promise<{ ok: true } | { error: string }> {
  const current = await getCmsDocumentById(supabase, id);
  const { error } = await supabase.from("content_documents").delete().eq("id", id);
  if (error) return { error: error.message };
  if (current) settleCmsPublicCache(current);
  return { ok: true };
}

export type CmsAtomicImportItem = {
  sourceId: string;
  docType: "knowledge" | "blog";
  slug: string;
  locale: string;
  title: string;
  body: CmsDocumentBody;
  seo: CmsDocumentSeo;
};

export type CmsAtomicImportResult = {
  ok: true;
  operationId: string;
  created: Array<{
    id: string;
    sourceId: string;
    cmsId: string;
    title: string;
    slug: string;
    status: "draft";
    rowVersion: number;
  }>;
  skipped: Array<{ id: string; cmsId: string; reason: "already_imported" }>;
  replayed: boolean;
};

export async function importCmsDocumentsAtomic(
  supabase: DbClient,
  input: {
    operationId: string;
    items: CmsAtomicImportItem[];
    actorId: string | null;
    ipAddress?: string | null;
  }
): Promise<CmsAtomicImportResult | CmsMutationFailure> {
  const payload = input.items.map((item) => ({
    ...item,
    body: item.body as Json,
    seo: item.seo as Json,
  }));
  const payloadHash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  const { data, error } = await supabase.rpc("cms_import_documents_atomic", {
    p_operation_id: input.operationId,
    p_payload_hash: payloadHash,
    p_items: payload as Json,
    p_actor_id: actorUuid(input.actorId),
    p_ip_address: input.ipAddress ?? null,
  });
  if (error) return cmsFailure(error);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { error: "Не удалось прочитать результат импорта", code: "FAILED" };
  }
  const value = data as Record<string, Json | undefined>;
  return {
    ok: true,
    operationId: typeof value.operationId === "string" ? value.operationId : input.operationId,
    created: Array.isArray(value.created) ? (value.created as CmsAtomicImportResult["created"]) : [],
    skipped: Array.isArray(value.skipped) ? (value.skipped as CmsAtomicImportResult["skipped"]) : [],
    replayed: value.replayed === true,
  };
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
    allowPublish?: boolean;
    expectedVersion: number;
    ipAddress?: string | null;
  }
): Promise<{ document: CmsDocument; restoredRevision: CmsRevision } | CmsMutationFailure> {
  const revision = await getCmsRevisionById(supabase, documentId, revisionId);
  if (!revision) return { error: "Ревизия не найдена", code: "NOT_FOUND" };
  const publicationValidation = await validateExistingKnowledgePublicMutation(
    supabase,
    documentId,
    input.expectedVersion,
    {
      title: revision.title,
      body: revision.body,
      seo: revision.seo,
      status: input.publish ? "published" : "draft",
    },
  );
  if (publicationValidation) return publicationValidation;

  const { data, error } = await supabase.rpc("cms_mutate_document_atomic", {
    p_document_id: documentId,
    p_expected_version: input.expectedVersion,
    p_actor_id: actorUuid(input.actorId),
    p_operation: input.publish ? "restore_publish" : "restore",
    p_allow_publish: input.allowPublish === true || input.publish === true,
    p_restore_revision_id: revisionId,
    p_ip_address: input.ipAddress ?? null,
  });
  if (error) return cmsFailure(error);
  const document = documentFromRpc(data);
  if (!document) return { error: "Не удалось прочитать документ", code: "FAILED" };
  await settleCmsSearchIntent(supabase, document);
  settleCmsPublicCache(document);
  return { document, restoredRevision: revision };
}
