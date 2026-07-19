#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "../src/types/database";

type LegacyArticle = { id: string | number; source: string; source_id: string; title?: string; text?: string; summary?: string; author?: string | null; created_at?: string; updated_at?: string | null; media?: string[]; tags?: string[]; category?: string | null; province?: string | null; city?: string | null; language?: string; url?: string | null; fingerprint?: string; editorial_status?: string; metadata?: Record<string, unknown> };
type LegacyMessage = { id: string | number; channel?: string; date?: string; text?: string; media_type?: string | null; media_path?: string[]; views?: number; forwards?: number; reactions?: unknown[] };
type LegacySource = { name: string; type: string; enabled?: boolean; limit?: number; tags?: string[]; category?: string; trust_score?: number; url?: string; feed_url?: string; languages?: string[]; include_transcript?: boolean };

const root = path.resolve(import.meta.dirname, "..");
const defaultCollectorRoot = path.resolve(root, "../Argentina-Knowledge-Collector");
const apply = process.argv.includes("--apply");
const collectorArg = process.argv.find((value) => value.startsWith("--collector="));
const collectorRoot = path.resolve(collectorArg?.slice("--collector=".length) || defaultCollectorRoot);
const migrationId = "argentina-knowledge-native-v1";

function loadEnvLocal() { const file = path.join(root, ".env.local"); if (!fs.existsSync(file)) return; for (const line of fs.readFileSync(file, "utf8").split("\n")) { const value = line.trim(); if (!value || value.startsWith("#")) continue; const at = value.indexOf("="); if (at < 1) continue; const key = value.slice(0, at).trim(); if (!process.env[key]) process.env[key] = value.slice(at + 1).trim(); } }
function json<T>(file: string): T { return JSON.parse(fs.readFileSync(file, "utf8")) as T; }
function hash(value: unknown): string { return createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex"); }
function object(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }

function inventory() {
  const sourceConfig = json<{ sources: LegacySource[] }>(path.join(collectorRoot, "config/sources.json"));
  const articles: Array<{ article: LegacyArticle; message: LegacyMessage | null; file: string }> = [];
  const articleRoot = path.join(collectorRoot, "raw/telegram");
  for (const channel of fs.existsSync(articleRoot) ? fs.readdirSync(articleRoot) : []) {
    const dir = path.join(articleRoot, channel, "articles"); if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir).filter((item) => item.endsWith(".json")).sort()) {
      const file = path.join(dir, name); const article = json<LegacyArticle>(file); const messageFile = path.join(articleRoot, channel, "messages", `${article.id}.json`); articles.push({ article, message: fs.existsSync(messageFile) ? json<LegacyMessage>(messageFile) : null, file });
    }
  }
  const mediaRoot = path.join(collectorRoot, "media"); const media = fs.existsSync(mediaRoot) ? fs.readdirSync(mediaRoot, { recursive: true }).map(String).filter((item) => fs.statSync(path.join(mediaRoot, item)).isFile()).map((item) => ({ path: item, checksum: hash(fs.readFileSync(path.join(mediaRoot, item))), bytes: fs.statSync(path.join(mediaRoot, item)).size })) : [];
  return { sources: sourceConfig.sources, articles, media };
}

async function main() {
  if (!fs.existsSync(collectorRoot)) throw new Error(`Collector directory not found: ${collectorRoot}`);
  const snapshot = inventory();
  const valid = snapshot.articles.filter(({ article }) => String(article.title ?? "").trim() && String(article.text ?? "").trim().length >= 120 && /^\d+$/.test(String(article.id)));
  const report = { mode: apply ? "apply" : "dry-run", migrationId, collectorRoot, discovered: { sources: snapshot.sources.length, rawDocuments: snapshot.articles.length, validArticles: valid.length, skippedArticles: snapshot.articles.length - valid.length, media: snapshot.media.length, mediaBytes: snapshot.media.reduce((sum, item) => sum + item.bytes, 0) }, migrated: { sources: 0, rawDocuments: 0, articles: 0, media: 0 }, verified: { checksums: 0 }, media: snapshot.media };
  if (!apply) { console.log(JSON.stringify(report, null, 2)); return; }
  loadEnvLocal(); const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(); const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(); if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  const db = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const sourceIds = new Map<string, string>();
  for (const source of snapshot.sources) {
    const type = source.type === "web" ? "website" : source.type; const legacyKey = `${type}:${source.name}`;
    const connectionConfig = type === "telegram" ? { channel: `@${source.name}`, telegramMode: "mtproto", limit: source.limit ?? 20 } : type === "youtube" ? { url: source.url, languages: source.languages, includeTranscript: source.include_transcript, limit: source.limit ?? 10 } : { feedUrl: source.feed_url, url: source.url, limit: source.limit ?? 10 };
    const { data, error } = await db.from("ingestion_sources").upsert({ legacy_key: legacyKey, name: source.name, source_type: type, status: "paused", language: "ru", region: "Argentina", categories: source.tags ?? [source.category ?? "travel"], connection_config: connectionConfig as Json, credential_ref: type === "telegram" ? "ARGENTINA_TELEGRAM" : null, schedule_kind: "manual", enabled: false, priority: source.enabled ? 70 : 30, trust_level: source.trust_score ?? 50, legal_notes: "Migrated disabled; connection and reuse rights require verification." }, { onConflict: "legacy_key" }).select("id").single();
    if (error) throw error; sourceIds.set(legacyKey, data.id); report.migrated.sources += 1;
  }
  const telegramSourceId = sourceIds.get("telegram:vista_argentina"); if (!telegramSourceId) throw new Error("Migrated Telegram source not found");
  const runKey = `${migrationId}:${hash(valid.map((item) => item.article.id))}`; const { data: existingRun } = await db.from("ingestion_source_runs").select("id").eq("idempotency_key", runKey).maybeSingle();
  const runId = existingRun?.id ?? randomUUID(); if (!existingRun) { const { error } = await db.from("ingestion_source_runs").insert({ id: runId, source_id: telegramSourceId, trigger_kind: "migration", status: "processing", idempotency_key: runKey, started_at: new Date().toISOString(), checkpoint_before: {}, counts: {} }); if (error) throw error; }
  const storagePaths = new Map<string, string>();
  for (const media of snapshot.media) {
    const storagePath = `legacy/${media.path}`; const bytes = fs.readFileSync(path.join(collectorRoot, "media", media.path));
    const contentType = media.path.toLowerCase().endsWith(".png") ? "image/png" : media.path.toLowerCase().endsWith(".webp") ? "image/webp" : "image/jpeg";
    const { error: uploadError } = await db.storage.from("ingestion-raw").upload(storagePath, bytes, { contentType, upsert: true }); if (uploadError) throw uploadError;
    storagePaths.set(path.basename(media.path), storagePath); report.migrated.media += 1;
  }
  const rawIds = new Map<string, string>();
  for (const item of snapshot.articles) {
    const article = item.article; const legacyId = `telegram:vista_argentina:${article.id}`; const checksum = hash({ article, message: item.message }); const sourceUrl = /^\d+$/.test(String(article.id)) ? (article.url || `https://t.me/vista_argentina/${article.id}`) : article.url || null; const rawContent = item.message?.text ?? article.text ?? ""; const rawHash = hash({ rawContent, message: item.message, articleId: article.id });
    const media = (article.media ?? []).map((legacyPath) => ({ legacyPath, storagePath: storagePaths.get(path.basename(legacyPath)) ?? null, checksum: snapshot.media.find((entry) => entry.path.endsWith(path.basename(legacyPath)))?.checksum ?? null }));
    const { data: raw, error: rawError } = await db.from("ingestion_raw_documents").upsert({ source_id: telegramSourceId, source_run_id: runId, external_id: String(article.id), version: 1, source_url: sourceUrl, canonical_url: sourceUrl, raw_format: "telegram", raw_content: rawContent || null, raw_payload: (item.message ?? article) as unknown as Json, content_hash: rawHash, media: media as Json, title: article.title || null, author: article.author, language: article.language ?? "ru", source_published_at: item.message?.date ?? article.created_at, source_updated_at: article.updated_at, status: "fetched" }, { onConflict: "source_id,external_id,content_hash" }).select("id").single(); if (rawError) throw rawError;
    rawIds.set(String(article.id), raw.id); report.migrated.rawDocuments += 1;
    const isValid = valid.some((entry) => String(entry.article.id) === String(article.id));
    const { error: rawLedgerError } = await db.from("ingestion_migration_ledger").upsert({ migration_id: migrationId, source_system: "argentina-knowledge-collector", entity_type: "raw_document", legacy_id: legacyId, target_table: "ingestion_raw_documents", target_id: raw.id, checksum, status: isValid ? "verified" : "skipped", error_message: isValid ? null : "No publishable text; retained in private raw archive" }, { onConflict: "source_system,entity_type,legacy_id" }); if (rawLedgerError) throw rawLedgerError;
  }
  for (const item of valid) {
    const legacyId = `telegram:vista_argentina:${item.article.id}`; const checksum = hash({ article: item.article, message: item.message }); const { data: ledger } = await db.from("ingestion_migration_ledger").select("id,checksum,status").eq("source_system", "argentina-knowledge-collector").eq("entity_type", "article").eq("legacy_id", legacyId).maybeSingle();
    if (ledger?.checksum === checksum && ["migrated", "verified"].includes(ledger.status)) { report.verified.checksums += 1; continue; }
    const rawId = rawIds.get(String(item.article.id)); if (!rawId) throw new Error(`Raw migration missing for ${legacyId}`);
    const fingerprint = item.article.fingerprint || hash(`${item.article.title}\n${item.article.text}`); const metadata = object(item.article.metadata); const editorial = object(metadata.editorial); const score = Number(metadata.quality_score ?? editorial.score ?? 0); const flags = Array.isArray(editorial.flags) ? editorial.flags.filter((value): value is string => typeof value === "string") : []; const reasons = Array.isArray(editorial.reasons) ? editorial.reasons.filter((value): value is string => typeof value === "string") : [];
    const { data: normalized, error: normalizedError } = await db.from("ingestion_normalized_documents").upsert({ raw_document_id: rawId, source_id: telegramSourceId, source_run_id: runId, title: String(item.article.title), body: String(item.article.text), summary: item.article.summary ?? "", language: item.article.language ?? "ru", category: item.article.category, province: item.article.province, city: item.article.city, tags: item.article.tags ?? [], fingerprint, metadata: { legacyId, legacyFile: path.relative(collectorRoot, item.file), mediaChecksums: snapshot.media.filter((media) => (item.article.media ?? []).some((legacyPath) => legacyPath.includes(path.basename(media.path)))).map((media) => media.checksum) } }, { onConflict: "raw_document_id" }).select("id").single(); if (normalizedError) throw normalizedError;
    const candidateStatus = ["review", "accepted"].includes(item.article.editorial_status ?? "") ? "awaiting_moderation" : "rejected";
    const { data: candidate, error: candidateError } = await db.from("ingestion_candidates").upsert({ normalized_document_id: normalized.id, source_id: telegramSourceId, source_run_id: runId, status: candidateStatus, title: String(item.article.title), summary: item.article.summary ?? "", processed_content: String(item.article.text), language: item.article.language ?? "ru", category: item.article.category, province: item.article.province, city: item.article.city, tags: item.article.tags ?? [], quality_score: Math.max(0, Math.min(100, score)), freshness_score: 0, trust_score: Number(metadata.source_trust_score ?? 45), decision_reasons: reasons, flags: [...flags, "migrated_from_legacy_collector"], suggested_target: "knowledge" }, { onConflict: "normalized_document_id" }).select("id").single(); if (candidateError) throw candidateError;
    const { error: ledgerError } = await db.from("ingestion_migration_ledger").upsert({ migration_id: migrationId, source_system: "argentina-knowledge-collector", entity_type: "article", legacy_id: legacyId, target_table: "ingestion_candidates", target_id: candidate.id, checksum, status: "verified", error_message: null }, { onConflict: "source_system,entity_type,legacy_id" }); if (ledgerError) throw ledgerError;
    report.migrated.articles += 1; report.verified.checksums += 1;
  }
  await db.from("ingestion_source_runs").update({ status: "succeeded", completed_at: new Date().toISOString(), heartbeat_at: new Date().toISOString(), counts: { rawDocuments: report.migrated.rawDocuments, candidates: report.migrated.articles, media: report.migrated.media, verified: report.verified.checksums, skipped: report.discovered.skippedArticles } }).eq("id", runId);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
