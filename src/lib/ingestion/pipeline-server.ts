import "server-only";
import { createHash, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type { AdapterRawItem, IngestionSourceRecord, NormalizedIngestionDocument } from "@/types/ingestion";
import { getSourceAdapter } from "@/lib/ingestion/adapters";
import { analyzeWithOpenAi } from "@/lib/ingestion/ai-analysis";
import { contentSimilarity, evaluateEditorial } from "@/lib/ingestion/content-intelligence";
import { INGESTION_EDITORIAL_POLICY } from "@/lib/ingestion/policy";
import { getIngestionSource } from "@/lib/ingestion/repository-server";
import { nextSourceRunAt } from "@/lib/ingestion/schedule";
import { createCmsDocument, getCmsDocumentById } from "@/lib/cms/content-server";
import { uploadCmsMediaAsset } from "@/lib/media/cms-media-server";
import type { CmsDocType, CmsDocumentBody } from "@/types/cms-content";

type Db = SupabaseClient<Database>;
type Counts = { fetched: number; rawStored: number; normalized: number; candidates: number; duplicates: number; rejected: number; failed: number };
const activeStatuses = ["pending", "fetching", "fetched", "normalizing", "processing", "publishing"];

function actorUuid(value: string | null): string | null { return value && /^[0-9a-f-]{36}$/i.test(value) ? value : null; }
function errorText(error: unknown): string { return error instanceof Error ? error.message.slice(0, 1000) : "UNKNOWN_INGESTION_ERROR"; }
function rawHash(item: AdapterRawItem): string { return createHash("sha256").update(JSON.stringify({ title: item.title ?? "", content: item.rawContent ?? "", payload: item.rawPayload ?? {} })).digest("hex"); }

async function step<T>(db: Db, input: { runId: string; name: Database["public"]["Tables"]["ingestion_processing_steps"]["Insert"]["step_name"]; rawId?: string; candidateId?: string }, action: () => Promise<T>): Promise<T> {
  const started = Date.now();
  const { data } = await db.from("ingestion_processing_steps").insert({ source_run_id: input.runId, raw_document_id: input.rawId, candidate_id: input.candidateId, step_name: input.name, status: "running", started_at: new Date(started).toISOString() }).select("id").single();
  try {
    const result = await action();
    if (data) await db.from("ingestion_processing_steps").update({ status: "succeeded", completed_at: new Date().toISOString(), latency_ms: Date.now() - started }).eq("id", data.id);
    return result;
  } catch (error) {
    if (data) await db.from("ingestion_processing_steps").update({ status: "failed", completed_at: new Date().toISOString(), latency_ms: Date.now() - started, error_category: "processing", error_message: errorText(error) }).eq("id", data.id);
    throw error;
  }
}

async function storeRaw(db: Db, source: IngestionSourceRecord, runId: string, item: AdapterRawItem) {
  const hash = rawHash(item);
  const media: Json[] = [...(item.media ?? [])];
  for (const attachment of item.attachments ?? []) {
    const attachmentHash = createHash("sha256").update(attachment.bytes).digest("hex");
    const safeName = attachment.filename.replace(/[^a-z0-9._-]/gi, "_");
    const storagePath = `${source.id}/${runId}/${item.externalId}/${attachmentHash.slice(0, 12)}-${safeName}`;
    const { error: uploadError } = await db.storage.from("ingestion-raw").upload(storagePath, attachment.bytes, { contentType: attachment.mimeType, upsert: false });
    if (uploadError && !uploadError.message.toLowerCase().includes("already exists")) throw uploadError;
    media.push({ storagePath, filename: safeName, mimeType: attachment.mimeType, checksum: attachmentHash, private: true });
  }
  const { data: previous } = await db.from("ingestion_raw_documents").select("version").eq("source_id", source.id).eq("external_id", item.externalId).order("version", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await db.from("ingestion_raw_documents").insert({
    source_id: source.id, source_run_id: runId, external_id: item.externalId, version: (previous?.version ?? 0) + 1,
    source_url: item.sourceUrl, canonical_url: item.canonicalUrl, raw_format: item.rawFormat, raw_content: item.rawContent,
    raw_payload: item.rawPayload ?? {}, content_hash: hash, media, title: item.title, author: item.author,
    language: item.language, source_published_at: item.publishedAt, source_updated_at: item.updatedAt, status: "fetched",
  }).select("id").single();
  if (error?.code === "23505") {
    const { data: existing, error: existingError } = await db.from("ingestion_raw_documents").select("id").eq("source_id", source.id).eq("external_id", item.externalId).eq("content_hash", hash).single();
    if (existingError) throw existingError;
    return { id: existing.id, existing: true };
  }
  if (error) throw error;
  return { id: data.id, existing: false };
}

async function findDuplicate(db: Db, document: NormalizedIngestionDocument) {
  const { data: exact, error: exactError } = await db.from("ingestion_normalized_documents").select("id").eq("fingerprint", document.fingerprint).limit(1).maybeSingle();
  if (exactError) throw exactError;
  if (exact) return { normalizedId: exact.id, relation: "exact", similarity: 1 };
  let best: { normalizedId: string; relation: string; similarity: number } | null = null;
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await db.from("ingestion_normalized_documents").select("id,body").order("created_at", { ascending: false }).range(from, from + pageSize - 1);
    if (error) throw error;
    for (const row of data ?? []) {
      const similarity = contentSimilarity(document.body, row.body);
      if (similarity >= INGESTION_EDITORIAL_POLICY.duplicateSimilarity && (!best || similarity > best.similarity)) best = { normalizedId: row.id, relation: "near", similarity };
    }
    if (!data || data.length < pageSize) break;
  }
  return best;
}

async function activePrompt(db: Db) {
  const { data } = await db.from("ingestion_prompt_versions").select("id,model,system_prompt").eq("task", "content-analysis").eq("status", "active").maybeSingle();
  return data ? { id: data.id, model: data.model, systemPrompt: data.system_prompt } : null;
}

async function findRelatedCmsDocument(db: Db, document: NormalizedIngestionDocument) {
  const { data } = await db.from("content_documents").select("id,title,body").neq("status", "archived").order("updated_at", { ascending: false }).limit(150);
  let best: { id: string; score: number } | null = null;
  for (const row of data ?? []) {
    const score = contentSimilarity(`${document.title} ${document.summary} ${document.body}`, `${row.title} ${JSON.stringify(row.body)}`);
    if (score >= 0.3 && (!best || score > best.score)) best = { id: row.id, score };
  }
  return best;
}

export async function enqueueIngestionRun(db: Db, sourceId: string, input: { triggerKind: string; actorId: string | null; retryOfRunId?: string | null; idempotencyKey?: string; manualItems?: Array<{ id: string; title: string; body: string; url?: string; publishedAt?: string }> }) {
  const source = await getIngestionSource(db, sourceId);
  if (!source) throw new Error("SOURCE_NOT_FOUND");
  if (!source.enabled && input.triggerKind !== "migration" && input.triggerKind !== "shadow") throw new Error("SOURCE_DISABLED");
  const { data: existing } = await db.from("ingestion_source_runs").select("id,status").eq("source_id", sourceId).in("status", activeStatuses).maybeSingle();
  if (existing) return { runId: existing.id, existing: true };
  const retryRun = input.retryOfRunId ? await db.from("ingestion_source_runs").select("attempt,max_attempts").eq("id", input.retryOfRunId).maybeSingle() : null;
  const attempt = (retryRun?.data?.attempt ?? 0) + 1; const maxAttempts = retryRun?.data?.max_attempts ?? source.retryPolicy.maxAttempts;
  if (attempt > maxAttempts) throw new Error("RUN_RETRY_LIMIT_REACHED");
  const idempotencyKey = input.idempotencyKey ?? `${sourceId}:${input.triggerKind}:${new Date().toISOString().slice(0, 16)}:${randomUUID()}`;
  const checkpointBefore = input.manualItems?.length ? { ...source.checkpoint, __manualItems: input.manualItems } : source.checkpoint;
  const { data, error } = await db.from("ingestion_source_runs").insert({ source_id: sourceId, trigger_kind: input.triggerKind, idempotency_key: idempotencyKey, retry_of_run_id: input.retryOfRunId, attempt, max_attempts: maxAttempts, actor_user_id: actorUuid(input.actorId), checkpoint_before: checkpointBefore as Json, status: "pending" }).select("id").single();
  if (error) throw error;
  return { runId: data.id, existing: false };
}

export async function processIngestionRun(db: Db, runId: string): Promise<{ runId: string; status: string; counts: Counts }> {
  const { data: run, error: runError } = await db.from("ingestion_source_runs").select("*").eq("id", runId).single();
  if (runError) throw runError;
  const source = await getIngestionSource(db, run.source_id);
  if (!source) throw new Error("SOURCE_NOT_FOUND");
  const checkpointBefore = run.checkpoint_before && typeof run.checkpoint_before === "object" && !Array.isArray(run.checkpoint_before) ? run.checkpoint_before as Record<string, Json | undefined> : {};
  const manualItems = Array.isArray(checkpointBefore.__manualItems) ? checkpointBefore.__manualItems : null;
  const executionSource = manualItems ? { ...source, connectionConfig: { ...source.connectionConfig, manualItems: manualItems as IngestionSourceRecord["connectionConfig"]["manualItems"] } } : source;
  const counts: Counts = { fetched: 0, rawStored: 0, normalized: 0, candidates: 0, duplicates: 0, rejected: 0, failed: 0 };
  const adapter = getSourceAdapter(executionSource.sourceType);
  const check = adapter.validateConfig(executionSource);
  if (!check.ok) throw new Error(check.errors.join("; "));
  const startedAt = new Date().toISOString();
  await db.from("ingestion_source_runs").update({ status: "fetching", started_at: startedAt, heartbeat_at: startedAt }).eq("id", runId);
  await db.from("ingestion_sources").update({ last_run_at: startedAt, last_error: null }).eq("id", source.id);
  try {
    const fetched = await step(db, { runId, name: "fetch" }, () => adapter.fetch(executionSource));
    counts.fetched = fetched.items.length;
    await db.from("ingestion_source_runs").update({ status: "normalizing", counts: counts as unknown as Json, heartbeat_at: new Date().toISOString() }).eq("id", runId);
    const prompt = await activePrompt(db);
    for (const inputItem of fetched.items) {
      const cancel = await db.from("ingestion_source_runs").select("cancel_requested_at").eq("id", runId).single();
      if (cancel.data?.cancel_requested_at) throw new Error("RUN_CANCELLED");
      try {
        const item = await adapter.parse(inputItem, executionSource);
        const raw = await step(db, { runId, name: "persist_raw" }, () => storeRaw(db, executionSource, runId, item));
        if (raw.existing) {
          const { data: alreadyProcessed, error: alreadyProcessedError } = await db.from("ingestion_normalized_documents").select("id").eq("raw_document_id", raw.id).maybeSingle();
          if (alreadyProcessedError) throw alreadyProcessedError;
          if (alreadyProcessed) { counts.duplicates += 1; continue; }
        } else counts.rawStored += 1;
        const document = await step(db, { runId, name: "normalize", rawId: raw.id }, () => adapter.normalize(item, executionSource));
        const duplicate = await step(db, { runId, name: "deduplicate", rawId: raw.id }, () => findDuplicate(db, document));
        const relatedCms = duplicate ? null : await findRelatedCmsDocument(db, document);
        const { data: normalized, error: normalizedError } = await db.from("ingestion_normalized_documents").insert({ raw_document_id: raw.id, source_id: source.id, source_run_id: runId, title: document.title, body: document.body, summary: document.summary, language: document.language, category: document.category, province: document.province, city: document.city, tags: document.tags, fingerprint: document.fingerprint, metadata: document.metadata as Json }).select("id").single();
        if (normalizedError) throw normalizedError;
        counts.normalized += 1;
        const decision = await step(db, { runId, name: "quality", rawId: raw.id }, async () => evaluateEditorial(document, executionSource.trustLevel, (item.media?.length ?? 0) + (item.attachments?.length ?? 0)));
        let ai = null;
        const aiFlags: string[] = [];
        if (prompt && decision.selected) {
          try { ai = await step(db, { runId, name: "ai", rawId: raw.id }, () => analyzeWithOpenAi(document, prompt)); }
          catch { aiFlags.push("ai_analysis_unavailable"); }
        }
        const duplicateCandidate = duplicate ? await db.from("ingestion_candidates").select("id").eq("normalized_document_id", duplicate.normalizedId).maybeSingle() : null;
        const status = duplicate ? "duplicate" : decision.selected ? "awaiting_moderation" : "rejected";
        const analysis = ai?.analysis;
        const { data: candidate, error: candidateError } = await db.from("ingestion_candidates").insert({
          normalized_document_id: normalized.id, source_id: source.id, source_run_id: runId, status,
          title: analysis?.translatedTitle || document.title, summary: analysis?.summary ?? document.summary, processed_content: analysis?.translatedBody || document.body,
          language: document.language, category: analysis?.category ?? document.category, province: analysis?.province ?? document.province,
          city: analysis?.city ?? document.city, tags: analysis?.tags ?? document.tags, quality_score: decision.score,
          freshness_score: analysis?.freshnessScore ?? decision.freshnessScore, trust_score: executionSource.trustLevel,
          decision_reasons: decision.reasons, flags: [...decision.flags, ...aiFlags, ...(analysis?.flags ?? []), ...(analysis?.translationApplied ? ["machine_translation_requires_review"] : [])],
          extracted_entities: (analysis?.entities ?? []) as Json, suggested_target: analysis?.suggestedTarget ?? "knowledge",
          ai_result: ai?.raw ?? null, ai_prompt_version: ai?.promptVersion, ai_model: ai?.model, ai_latency_ms: ai?.latencyMs,
          ai_input_tokens: ai?.inputTokens, ai_output_tokens: ai?.outputTokens,
          related_cms_document_id: relatedCms?.id ?? null, related_content_score: relatedCms?.score ?? null,
        }).select("id").single();
        if (candidateError) throw candidateError;
        if (duplicate && duplicateCandidate?.data) await db.from("ingestion_duplicate_links").insert({ candidate_id: candidate.id, related_candidate_id: duplicateCandidate.data.id, relation_type: duplicate.relation, similarity: duplicate.similarity });
        if (status === "duplicate") counts.duplicates += 1; else if (status === "rejected") counts.rejected += 1; else counts.candidates += 1;
      } catch { counts.failed += 1; }
      await db.from("ingestion_source_runs").update({ counts: counts as unknown as Json, heartbeat_at: new Date().toISOString() }).eq("id", runId);
    }
    const finalStatus = counts.failed > 0 ? (counts.fetched > counts.failed ? "partial" : "failed") : "succeeded";
    const completedAt = new Date().toISOString();
    const nextRunAt = nextSourceRunAt(source, new Date(completedAt));
    const nextCheckpoint = finalStatus === "succeeded" ? adapter.checkpoint(fetched) : source.checkpoint;
    await db.from("ingestion_source_runs").update({ status: finalStatus, counts: counts as unknown as Json, checkpoint_after: nextCheckpoint as Json, completed_at: completedAt, heartbeat_at: completedAt }).eq("id", runId);
    await db.from("ingestion_sources").update({ checkpoint: nextCheckpoint as Json, status: finalStatus === "succeeded" ? "active" : "degraded", last_success_at: finalStatus === "succeeded" ? completedAt : source.lastSuccessAt, next_run_at: nextRunAt, last_error: finalStatus === "succeeded" ? null : `${counts.failed} материалов завершились ошибкой` }).eq("id", source.id);
    return { runId, status: finalStatus, counts };
  } catch (error) {
    const status = errorText(error) === "RUN_CANCELLED" ? "cancelled" : "failed";
    const exhausted = status === "failed" && run.attempt >= run.max_attempts;
    const retryDelay = Math.min(source.retryPolicy.maxDelaySeconds, source.retryPolicy.baseDelaySeconds * 2 ** Math.max(0, run.attempt - 1));
    await db.from("ingestion_source_runs").update({ status, counts: counts as unknown as Json, error_category: exhausted ? "dead_letter" : "pipeline", error_message: errorText(error), completed_at: new Date().toISOString(), next_retry_at: status === "failed" && !exhausted ? new Date(Date.now() + retryDelay * 1000).toISOString() : null, dead_lettered_at: exhausted ? new Date().toISOString() : null }).eq("id", runId);
    await db.from("ingestion_sources").update({ status: status === "cancelled" ? source.status : "failed", last_error: errorText(error) }).eq("id", source.id);
    return { runId, status, counts };
  }
}

export async function reprocessIngestionCandidate(db: Db, candidateId: string) {
  const { data: candidate, error: candidateError } = await db.from("ingestion_candidates").select("*").eq("id", candidateId).single();
  if (candidateError) throw candidateError;
  if (["publishing", "published"].includes(candidate.status)) throw new Error("PUBLISHED_CANDIDATE_CANNOT_BE_REPROCESSED");
  const { data: normalized, error: normalizedError } = await db.from("ingestion_normalized_documents").select("*").eq("id", candidate.normalized_document_id).single();
  if (normalizedError) throw normalizedError;
  const { data: raw, error: rawError } = await db.from("ingestion_raw_documents").select("*").eq("id", normalized.raw_document_id).single();
  if (rawError) throw rawError;
  const source = await getIngestionSource(db, candidate.source_id);
  if (!source) throw new Error("SOURCE_NOT_FOUND");
  const metadata = normalized.metadata && typeof normalized.metadata === "object" && !Array.isArray(normalized.metadata) ? normalized.metadata as Record<string, Json | undefined> : {};
  const document: NormalizedIngestionDocument = {
    title: normalized.title, body: normalized.body, summary: normalized.summary, language: normalized.language,
    category: normalized.category ?? "travel", province: normalized.province, city: normalized.city,
    tags: normalized.tags, fingerprint: normalized.fingerprint, sourceUrl: raw.canonical_url ?? raw.source_url,
    author: raw.author, publishedAt: raw.source_published_at, metadata,
  };
  const mediaCount = Array.isArray(raw.media) ? raw.media.length : 0;
  const decision = await step(db, { runId: candidate.source_run_id, name: "quality", rawId: raw.id, candidateId }, async () => evaluateEditorial(document, source.trustLevel, mediaCount));
  const prompt = await activePrompt(db);
  let ai = null;
  const aiFlags: string[] = [];
  if (prompt && decision.selected) {
    try { ai = await step(db, { runId: candidate.source_run_id, name: "ai", rawId: raw.id, candidateId }, () => analyzeWithOpenAi(document, prompt)); }
    catch { aiFlags.push("ai_analysis_unavailable"); }
  }
  const analysis = ai?.analysis;
  const { data: updated, error: updateError } = await db.from("ingestion_candidates").update({
    status: decision.selected ? "awaiting_moderation" : "rejected",
    title: analysis?.translatedTitle || document.title, summary: analysis?.summary ?? document.summary,
    processed_content: analysis?.translatedBody || document.body, language: document.language,
    category: analysis?.category ?? document.category, province: analysis?.province ?? document.province,
    city: analysis?.city ?? document.city, tags: analysis?.tags ?? document.tags,
    quality_score: decision.score, freshness_score: analysis?.freshnessScore ?? decision.freshnessScore,
    trust_score: source.trustLevel, decision_reasons: decision.reasons,
    flags: [...decision.flags, ...aiFlags, ...(analysis?.flags ?? []), ...(analysis?.translationApplied ? ["machine_translation_requires_review"] : [])],
    extracted_entities: (analysis?.entities ?? []) as Json, suggested_target: analysis?.suggestedTarget ?? candidate.suggested_target,
    ai_result: ai?.raw ?? null, ai_prompt_version: ai?.promptVersion ?? null, ai_model: ai?.model ?? null,
    ai_latency_ms: ai?.latencyMs ?? null, ai_input_tokens: ai?.inputTokens ?? null, ai_output_tokens: ai?.outputTokens ?? null,
    moderated_by: null, moderated_at: null, moderation_notes: null,
  }).eq("id", candidateId).select("*").single();
  if (updateError) throw updateError;
  return updated;
}

function slugForCandidate(title: string, id: string): string {
  const translit: Record<string, string> = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ы:"y",э:"e",ю:"yu",я:"ya" };
  const value = title.toLowerCase().split("").map((char) => translit[char] ?? char).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
  return `${value || "argentina-material"}-${id.slice(0, 8)}`;
}

function draftSpec(candidate: Database["public"]["Tables"]["ingestion_candidates"]["Row"], normalized: Database["public"]["Tables"]["ingestion_normalized_documents"]["Row"], raw: Database["public"]["Tables"]["ingestion_raw_documents"]["Row"], publicMedia: string[]): { docType: CmsDocType; body: CmsDocumentBody } {
  if (candidate.suggested_target === "source_only") throw new Error("SOURCE_ONLY_CANDIDATE_CANNOT_CREATE_DOCUMENT");
  if (candidate.suggested_target === "place") return { docType: "place", body: { kind: "place", shortDescription: candidate.summary, fullDescription: candidate.processed_content } };
  if (["city", "region"].includes(candidate.suggested_target)) return { docType: "destination", body: { kind: "destination", description: candidate.summary, intro: candidate.processed_content } };
  if (["route", "map"].includes(candidate.suggested_target)) return { docType: "guide", body: { kind: "guide", description: candidate.summary, category: candidate.category ?? "travel", sections: [{ heading: candidate.title, paragraphs: candidate.processed_content.split(/\n\n+/).filter(Boolean) }] } };
  const docType: CmsDocType = ["blog", "news", "event"].includes(candidate.suggested_target) ? "blog" : "knowledge";
  return { docType, body: { kind: "blog", excerpt: candidate.summary, content: candidate.processed_content, sections: [{ title: candidate.title, body: candidate.processed_content }], collector: { schemaVersion: 2, identity: candidate.id, source: "argentina-travel-ingestion", sourceId: candidate.source_id, sourceItemId: raw.external_id, sourceUrl: raw.canonical_url ?? raw.source_url ?? undefined, fingerprint: normalized.fingerprint, qualityScore: candidate.quality_score, scoreBreakdown: {}, flags: candidate.flags, category: candidate.category ?? undefined, province: candidate.province ?? undefined, city: candidate.city ?? undefined, tags: candidate.tags, media: publicMedia, collectedAt: raw.fetched_at } } };
}

async function promoteCandidateMedia(db: Db, candidate: Database["public"]["Tables"]["ingestion_candidates"]["Row"], raw: Database["public"]["Tables"]["ingestion_raw_documents"]["Row"], actorId: string): Promise<string[]> {
  if (!Array.isArray(raw.media)) return [];
  const urls: string[] = [];
  for (const value of raw.media.slice(0, 8)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const storagePath = typeof value.storagePath === "string" ? value.storagePath : null;
    const mimeType = typeof value.mimeType === "string" ? value.mimeType : "image/jpeg";
    if (!storagePath || !mimeType.startsWith("image/")) continue;
    const { data, error } = await db.storage.from("ingestion-raw").download(storagePath);
    if (error) throw error;
    const filename = typeof value.filename === "string" ? value.filename : storagePath.split("/").at(-1) ?? "source-image.jpg";
    const file = new File([new Uint8Array(await data.arrayBuffer())], filename, { type: mimeType });
    const uploaded = await uploadCmsMediaAsset(db, { file, title: candidate.title, alt: candidate.title, category: "blog-article", role: "content", tags: candidate.tags, actorId });
    if ("error" in uploaded) throw new Error(uploaded.error);
    const sourcePageUrl = raw.canonical_url ?? raw.source_url;
    const { error: metadataError } = await db.from("cms_media_assets").update({ original_url: `ingestion-raw://${storagePath}`, source_page_url: sourcePageUrl?.startsWith("https://") ? sourcePageUrl : null, content_hash: typeof value.checksum === "string" ? value.checksum : null, rights_status: "review_required" }).eq("id", uploaded.asset.id);
    if (metadataError) throw metadataError;
    urls.push(uploaded.asset.public_url);
  }
  return urls;
}

function proposedBody(current: Json, candidate: Database["public"]["Tables"]["ingestion_candidates"]["Row"]): Json | null {
  if (!current || typeof current !== "object" || Array.isArray(current)) return null;
  const body = { ...current } as Record<string, Json | undefined>; const addition = candidate.processed_content;
  if (body.kind === "blog") { body.content = `${String(body.content ?? "")}\n\n${addition}`.trim(); const sections = Array.isArray(body.sections) ? body.sections : []; body.sections = [...sections, { title: candidate.title, body: addition }]; return body; }
  if (body.kind === "guide") { const sections = Array.isArray(body.sections) ? body.sections : []; body.sections = [...sections, { heading: candidate.title, paragraphs: addition.split(/\n\n+/).filter(Boolean) }]; return body; }
  if (body.kind === "place") { body.fullDescription = `${String(body.fullDescription ?? "")}\n\n${addition}`.trim(); return body; }
  if (body.kind === "destination") { body.intro = `${String(body.intro ?? "")}\n\n${addition}`.trim(); return body; }
  if (body.kind === "author_article") { const sections = Array.isArray(body.sections) ? body.sections : []; body.sections = [...sections, { title: candidate.title, body: addition }]; return body; }
  return null;
}

async function linkCandidateCitation(db: Db, documentId: string, candidate: Database["public"]["Tables"]["ingestion_candidates"]["Row"], raw: Database["public"]["Tables"]["ingestion_raw_documents"]["Row"]) {
  const sourceUrl = raw.canonical_url ?? raw.source_url; if (!sourceUrl?.startsWith("https://")) return;
  const { data: citation, error: citationError } = await db.from("content_sources").upsert({ title: raw.title ?? candidate.title, authority: "third_party", url: sourceUrl, source_type: raw.raw_format, jurisdiction: "Argentina", language: raw.language ?? candidate.language, published_at: raw.source_published_at, checked_at: raw.fetched_at, accessed_at: raw.fetched_at, content_hash: raw.content_hash, trust_level: candidate.trust_score >= 75 ? "high" : candidate.trust_score >= 50 ? "medium" : "low", status: "active", notes: `Imported by ingestion source ${candidate.source_id}` }, { onConflict: "url" }).select("id").single();
  if (citationError) throw citationError;
  if (citation) { const { error } = await db.from("content_source_links").upsert({ content_document_id: documentId, source_id: citation.id, section_id: "source", purpose: "origin", is_primary: true }, { onConflict: "content_document_id,source_id,section_id" }); if (error) throw error; }
}

export async function publishIngestionCandidateAsDraft(db: Db, candidateId: string, actorId: string, ipAddress?: string | null) {
  const { data: candidate, error } = await db.from("ingestion_candidates").select("*").eq("id", candidateId).single();
  if (error) throw error;
  if (candidate.cms_document_id) {
    const existing = await getCmsDocumentById(db, candidate.cms_document_id);
    if (existing) return existing;
  }
  if (!["approved", "awaiting_moderation"].includes(candidate.status)) throw new Error("CANDIDATE_NOT_PUBLISHABLE");
  const { data: normalized } = await db.from("ingestion_normalized_documents").select("*").eq("id", candidate.normalized_document_id).single();
  const { data: raw } = normalized ? await db.from("ingestion_raw_documents").select("*").eq("id", normalized.raw_document_id).single() : { data: null };
  if (!normalized || !raw) throw new Error("CANDIDATE_PROVENANCE_MISSING");
  const { data: claimed, error: claimError } = await db.from("ingestion_candidates").update({ status: "publishing" }).eq("id", candidateId).in("status", ["approved", "awaiting_moderation"]).select("id").maybeSingle();
  if (claimError) throw claimError;
  if (!claimed) throw new Error("CANDIDATE_PUBLICATION_ALREADY_IN_PROGRESS");
  try {
  if (candidate.related_cms_document_id) {
    const current = await getCmsDocumentById(db, candidate.related_cms_document_id); if (!current) throw new Error("RELATED_CMS_DOCUMENT_NOT_FOUND");
    const body = proposedBody(current.body as Json, candidate); if (!body) throw new Error("RELATED_CMS_DOCUMENT_UPDATE_UNSUPPORTED");
    const { error: proposalError } = await db.from("ingestion_update_proposals").upsert({ candidate_id: candidate.id, content_document_id: current.id, base_version: current.rowVersion, proposed_title: current.title, proposed_body: body, diff: { addedSourceCandidateId: candidate.id, addedCharacters: candidate.processed_content.length, sourceTitle: candidate.title }, status: "pending" }, { onConflict: "candidate_id" });
    if (proposalError) throw proposalError;
    await linkCandidateCitation(db, current.id, candidate, raw);
    const { error: candidateUpdateError } = await db.from("ingestion_candidates").update({ status: "approved", cms_document_id: current.id, publication_target: "cms_update_proposal", moderated_by: actorUuid(actorId), moderated_at: new Date().toISOString(), published_at: null }).eq("id", candidateId);
    if (candidateUpdateError) throw candidateUpdateError;
    return current;
  }
  const publicMedia = await promoteCandidateMedia(db, candidate, raw, actorId);
  const spec = draftSpec(candidate, normalized, raw, publicMedia);
  const result = await createCmsDocument(db, {
    docType: spec.docType, slug: slugForCandidate(candidate.title, candidate.id),
    title: candidate.title, status: "draft", actorId, ipAddress,
    body: spec.body,
    seo: { description: candidate.summary.slice(0, 160), noIndex: true },
  });
  if ("error" in result) { await db.from("ingestion_candidates").update({ status: "approved", moderation_notes: result.error }).eq("id", candidateId); throw new Error(result.error); }
  await linkCandidateCitation(db, result.document.id, candidate, raw);
  const { error: candidateUpdateError } = await db.from("ingestion_candidates").update({ status: "published", cms_document_id: result.document.id, publication_target: "cms_draft", moderated_by: actorUuid(actorId), moderated_at: new Date().toISOString(), published_at: new Date().toISOString() }).eq("id", candidateId);
  if (candidateUpdateError) throw candidateUpdateError;
  return result.document;
  } catch (publicationError) {
    await db.from("ingestion_candidates").update({ status: "approved", moderation_notes: errorText(publicationError) }).eq("id", candidateId).eq("status", "publishing");
    throw publicationError;
  }
}
