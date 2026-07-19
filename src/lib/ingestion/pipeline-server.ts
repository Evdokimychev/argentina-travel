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
import { createCmsDocument } from "@/lib/cms/content-server";

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
  if (error?.code === "23505") return null;
  if (error) throw error;
  return data;
}

async function findDuplicate(db: Db, document: NormalizedIngestionDocument) {
  const { data } = await db.from("ingestion_normalized_documents").select("id,body,fingerprint").order("created_at", { ascending: false }).limit(150);
  const exact = data?.find((row) => row.fingerprint === document.fingerprint);
  if (exact) return { normalizedId: exact.id, relation: "exact", similarity: 1 };
  let best: { normalizedId: string; relation: string; similarity: number } | null = null;
  for (const row of data ?? []) {
    const similarity = contentSimilarity(document.body, row.body);
    if (similarity >= INGESTION_EDITORIAL_POLICY.duplicateSimilarity && (!best || similarity > best.similarity)) best = { normalizedId: row.id, relation: "near", similarity };
  }
  return best;
}

async function activePrompt(db: Db) {
  const { data } = await db.from("ingestion_prompt_versions").select("id,model,system_prompt").eq("task", "content-analysis").eq("status", "active").maybeSingle();
  return data ? { id: data.id, model: data.model, systemPrompt: data.system_prompt } : null;
}

export async function enqueueIngestionRun(db: Db, sourceId: string, input: { triggerKind: string; actorId: string | null; retryOfRunId?: string | null; idempotencyKey?: string }) {
  const source = await getIngestionSource(db, sourceId);
  if (!source) throw new Error("SOURCE_NOT_FOUND");
  if (!source.enabled && input.triggerKind !== "migration" && input.triggerKind !== "shadow") throw new Error("SOURCE_DISABLED");
  const { data: existing } = await db.from("ingestion_source_runs").select("id,status").eq("source_id", sourceId).in("status", activeStatuses).maybeSingle();
  if (existing) return { runId: existing.id, existing: true };
  const retryRun = input.retryOfRunId ? await db.from("ingestion_source_runs").select("attempt,max_attempts").eq("id", input.retryOfRunId).maybeSingle() : null;
  const attempt = (retryRun?.data?.attempt ?? 0) + 1; const maxAttempts = retryRun?.data?.max_attempts ?? source.retryPolicy.maxAttempts;
  if (attempt > maxAttempts) throw new Error("RUN_RETRY_LIMIT_REACHED");
  const idempotencyKey = input.idempotencyKey ?? `${sourceId}:${input.triggerKind}:${new Date().toISOString().slice(0, 16)}:${randomUUID()}`;
  const { data, error } = await db.from("ingestion_source_runs").insert({ source_id: sourceId, trigger_kind: input.triggerKind, idempotency_key: idempotencyKey, retry_of_run_id: input.retryOfRunId, attempt, max_attempts: maxAttempts, actor_user_id: actorUuid(input.actorId), checkpoint_before: source.checkpoint, status: "pending" }).select("id").single();
  if (error) throw error;
  return { runId: data.id, existing: false };
}

export async function processIngestionRun(db: Db, runId: string): Promise<{ runId: string; status: string; counts: Counts }> {
  const { data: run, error: runError } = await db.from("ingestion_source_runs").select("*").eq("id", runId).single();
  if (runError) throw runError;
  const source = await getIngestionSource(db, run.source_id);
  if (!source) throw new Error("SOURCE_NOT_FOUND");
  const counts: Counts = { fetched: 0, rawStored: 0, normalized: 0, candidates: 0, duplicates: 0, rejected: 0, failed: 0 };
  const adapter = getSourceAdapter(source.sourceType);
  const check = adapter.validateConfig(source);
  if (!check.ok) throw new Error(check.errors.join("; "));
  const startedAt = new Date().toISOString();
  await db.from("ingestion_source_runs").update({ status: "fetching", started_at: startedAt, heartbeat_at: startedAt }).eq("id", runId);
  await db.from("ingestion_sources").update({ last_run_at: startedAt, last_error: null }).eq("id", source.id);
  try {
    const fetched = await step(db, { runId, name: "fetch" }, () => adapter.fetch(source));
    counts.fetched = fetched.items.length;
    await db.from("ingestion_source_runs").update({ status: "normalizing", counts: counts as unknown as Json, heartbeat_at: new Date().toISOString() }).eq("id", runId);
    const prompt = await activePrompt(db);
    for (const inputItem of fetched.items) {
      const cancel = await db.from("ingestion_source_runs").select("cancel_requested_at").eq("id", runId).single();
      if (cancel.data?.cancel_requested_at) throw new Error("RUN_CANCELLED");
      try {
        const item = await adapter.parse(inputItem, source);
        const raw = await step(db, { runId, name: "persist_raw" }, () => storeRaw(db, source, runId, item));
        if (!raw) { counts.duplicates += 1; continue; }
        counts.rawStored += 1;
        const document = await step(db, { runId, name: "normalize", rawId: raw.id }, () => adapter.normalize(item, source));
        const duplicate = await step(db, { runId, name: "deduplicate", rawId: raw.id }, () => findDuplicate(db, document));
        const { data: normalized, error: normalizedError } = await db.from("ingestion_normalized_documents").insert({ raw_document_id: raw.id, source_id: source.id, source_run_id: runId, title: document.title, body: document.body, summary: document.summary, language: document.language, category: document.category, province: document.province, city: document.city, tags: document.tags, fingerprint: document.fingerprint, metadata: document.metadata as Json }).select("id").single();
        if (normalizedError) throw normalizedError;
        counts.normalized += 1;
        const decision = await step(db, { runId, name: "quality", rawId: raw.id }, async () => evaluateEditorial(document, source.trustLevel, item.media?.length ?? 0));
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
          title: document.title, summary: analysis?.summary ?? document.summary, processed_content: document.body,
          language: document.language, category: analysis?.category ?? document.category, province: analysis?.province ?? document.province,
          city: analysis?.city ?? document.city, tags: analysis?.tags ?? document.tags, quality_score: decision.score,
          freshness_score: analysis?.freshnessScore ?? decision.freshnessScore, trust_score: source.trustLevel,
          decision_reasons: decision.reasons, flags: [...decision.flags, ...aiFlags, ...(analysis?.flags ?? [])],
          extracted_entities: (analysis?.entities ?? []) as Json, suggested_target: analysis?.suggestedTarget ?? "knowledge",
          ai_result: ai?.raw ?? null, ai_prompt_version: ai?.promptVersion, ai_model: ai?.model, ai_latency_ms: ai?.latencyMs,
          ai_input_tokens: ai?.inputTokens, ai_output_tokens: ai?.outputTokens,
        }).select("id").single();
        if (candidateError) throw candidateError;
        if (duplicate && duplicateCandidate?.data) await db.from("ingestion_duplicate_links").insert({ candidate_id: candidate.id, related_candidate_id: duplicateCandidate.data.id, relation_type: duplicate.relation, similarity: duplicate.similarity });
        if (status === "duplicate") counts.duplicates += 1; else if (status === "rejected") counts.rejected += 1; else counts.candidates += 1;
      } catch { counts.failed += 1; }
      await db.from("ingestion_source_runs").update({ counts: counts as unknown as Json, heartbeat_at: new Date().toISOString() }).eq("id", runId);
    }
    const finalStatus = counts.failed > 0 ? (counts.rawStored > counts.failed ? "partial" : "failed") : "succeeded";
    const completedAt = new Date().toISOString();
    const nextRunAt = nextSourceRunAt(source, new Date(completedAt));
    await db.from("ingestion_source_runs").update({ status: finalStatus, counts: counts as unknown as Json, checkpoint_after: adapter.checkpoint(fetched) as Json, completed_at: completedAt, heartbeat_at: completedAt }).eq("id", runId);
    await db.from("ingestion_sources").update({ checkpoint: adapter.checkpoint(fetched) as Json, status: finalStatus === "succeeded" ? "active" : "degraded", last_success_at: finalStatus === "succeeded" ? completedAt : source.lastSuccessAt, next_run_at: nextRunAt, last_error: finalStatus === "succeeded" ? null : `${counts.failed} материалов завершились ошибкой` }).eq("id", source.id);
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

function slugForCandidate(title: string, id: string): string {
  const translit: Record<string, string> = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ы:"y",э:"e",ю:"yu",я:"ya" };
  const value = title.toLowerCase().split("").map((char) => translit[char] ?? char).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
  return `${value || "argentina-material"}-${id.slice(0, 8)}`;
}

export async function publishIngestionCandidateAsDraft(db: Db, candidateId: string, actorId: string, ipAddress?: string | null) {
  const { data: candidate, error } = await db.from("ingestion_candidates").select("*").eq("id", candidateId).single();
  if (error) throw error;
  if (!["approved", "awaiting_moderation"].includes(candidate.status)) throw new Error("CANDIDATE_NOT_PUBLISHABLE");
  const { data: normalized } = await db.from("ingestion_normalized_documents").select("*").eq("id", candidate.normalized_document_id).single();
  const { data: raw } = normalized ? await db.from("ingestion_raw_documents").select("*").eq("id", normalized.raw_document_id).single() : { data: null };
  if (!normalized || !raw) throw new Error("CANDIDATE_PROVENANCE_MISSING");
  await db.from("ingestion_candidates").update({ status: "publishing" }).eq("id", candidateId);
  const result = await createCmsDocument(db, {
    docType: candidate.suggested_target === "blog" ? "blog" : "knowledge", slug: slugForCandidate(candidate.title, candidate.id),
    title: candidate.title, status: "draft", actorId, ipAddress,
    body: { kind: "blog", excerpt: candidate.summary, content: candidate.processed_content, sections: [{ title: candidate.title, body: candidate.processed_content }], collector: { schemaVersion: 2, identity: candidate.id, source: "argentina-travel-ingestion", sourceId: candidate.source_id, sourceItemId: raw.external_id, sourceUrl: raw.canonical_url ?? raw.source_url ?? undefined, fingerprint: normalized.fingerprint, qualityScore: candidate.quality_score, scoreBreakdown: {}, flags: candidate.flags, category: candidate.category ?? undefined, province: candidate.province ?? undefined, city: candidate.city ?? undefined, tags: candidate.tags, media: Array.isArray(raw.media) ? raw.media.filter((item): item is string => typeof item === "string") : [], collectedAt: raw.fetched_at } },
    seo: { description: candidate.summary.slice(0, 160), noIndex: true },
  });
  if ("error" in result) { await db.from("ingestion_candidates").update({ status: "approved", moderation_notes: result.error }).eq("id", candidateId); throw new Error(result.error); }
  const sourceUrl = raw.canonical_url ?? raw.source_url;
  if (sourceUrl?.startsWith("https://")) {
    const { data: citation } = await db.from("content_sources").upsert({ title: raw.title ?? candidate.title, authority: "third_party", url: sourceUrl, source_type: raw.raw_format, jurisdiction: "Argentina", language: raw.language ?? candidate.language, published_at: raw.source_published_at, checked_at: raw.fetched_at, accessed_at: raw.fetched_at, content_hash: raw.content_hash, trust_level: candidate.trust_score >= 75 ? "high" : candidate.trust_score >= 50 ? "medium" : "low", status: "active", notes: `Imported by ingestion source ${candidate.source_id}` }, { onConflict: "url" }).select("id").single();
    if (citation) await db.from("content_source_links").upsert({ content_document_id: result.document.id, source_id: citation.id, section_id: "source", purpose: "origin", is_primary: true }, { onConflict: "content_document_id,source_id,section_id" });
  }
  await db.from("ingestion_candidates").update({ status: "published", cms_document_id: result.document.id, publication_target: "cms_draft", moderated_by: actorUuid(actorId), moderated_at: new Date().toISOString(), published_at: new Date().toISOString() }).eq("id", candidateId);
  return result.document;
}
