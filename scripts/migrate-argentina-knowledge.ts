#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "../src/types/database";

type LegacyArticle = { id: string | number; source: string; source_id: string; title?: string; text?: string; summary?: string; author?: string | null; created_at?: string; updated_at?: string | null; media?: string[]; tags?: string[]; category?: string | null; province?: string | null; city?: string | null; language?: string; url?: string | null; fingerprint?: string; editorial_status?: string; metadata?: Record<string, unknown> };
type LegacyMessage = { id: string | number; channel?: string; date?: string; text?: string; media_type?: string | null; media_path?: string[]; views?: number; forwards?: number; reactions?: unknown[] };
type LegacySource = { name: string; type: string; enabled?: boolean; limit?: number; tags?: string[]; category?: string; trust_score?: number; url?: string; feed_url?: string; languages?: string[]; include_transcript?: boolean };
type LegacyArtifact = { path: string; checksum: string; bytes: number; contentType: string };

const root = path.resolve(import.meta.dirname, "..");
const defaultCollectorRoot = path.resolve(root, "../Argentina-Knowledge-Collector");
const apply = process.argv.includes("--apply");
const collectorArg = process.argv.find((value) => value.startsWith("--collector="));
const collectorRoot = path.resolve(collectorArg?.slice("--collector=".length) || defaultCollectorRoot);
const migrationId = "argentina-knowledge-native-v1";
const productionProjectRef = "uooxrypocahomoqzdvzy";

function loadEnvLocal() { const file = path.join(root, ".env.local"); if (!fs.existsSync(file)) return; for (const line of fs.readFileSync(file, "utf8").split("\n")) { const value = line.trim(); if (!value || value.startsWith("#")) continue; const at = value.indexOf("="); if (at < 1) continue; const key = value.slice(0, at).trim(); if (!process.env[key]) process.env[key] = value.slice(at + 1).trim(); } }
function json<T>(file: string): T { return JSON.parse(fs.readFileSync(file, "utf8")) as T; }
function hash(value: unknown): string { return createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex"); }
function hashBytes(value: Uint8Array): string { return createHash("sha256").update(value).digest("hex"); }
function object(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function contentType(file: string): string {
  const extension = path.extname(file).toLowerCase();
  return ({ ".json": "application/json", ".md": "text/markdown; charset=utf-8", ".html": "text/html; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" } as Record<string, string>)[extension] ?? "application/octet-stream";
}
function walkFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(file) : entry.isFile() ? [file] : [];
  });
}
function mediaKey(legacyPath: string): string {
  const normalized = legacyPath.replaceAll("\\", "/");
  const marker = normalized.lastIndexOf("media/");
  const key = (marker >= 0 ? normalized.slice(marker + "media/".length) : normalized).replace(/^\/+/, "");
  if (!key || key.split("/").includes("..")) throw new Error(`Unsafe legacy media path: ${legacyPath}`);
  return key;
}

function storageSafePath(legacyPath: string): string {
  return legacyPath.split("/").map((segment) => {
    if (/^[A-Za-z0-9._-]+$/.test(segment)) return segment;
    return `utf8-${Buffer.from(segment, "utf8").toString("base64url")}`;
  }).join("/");
}

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
  const mediaRoot = path.join(collectorRoot, "media");
  const media = walkFiles(mediaRoot).sort().map((file) => ({ path: path.relative(mediaRoot, file).split(path.sep).join("/"), checksum: hashBytes(fs.readFileSync(file)), bytes: fs.statSync(file).size }));
  const archiveRoots = ["raw", "knowledge", "exports", "config"];
  const artifacts: LegacyArtifact[] = archiveRoots.flatMap((archiveRoot) => walkFiles(path.join(collectorRoot, archiveRoot))).sort().map((file) => ({ path: path.relative(collectorRoot, file).split(path.sep).join("/"), checksum: hashBytes(fs.readFileSync(file)), bytes: fs.statSync(file).size, contentType: contentType(file) }));
  return { sources: sourceConfig.sources, articles, media, artifacts };
}

async function main() {
  if (!fs.existsSync(collectorRoot)) throw new Error(`Collector directory not found: ${collectorRoot}`);
  const snapshot = inventory();
  const valid = snapshot.articles.filter(({ article }) => String(article.title ?? "").trim() && String(article.text ?? "").trim().length >= 120 && /^\d+$/.test(String(article.id)));
  const report = { mode: apply ? "apply" : "dry-run", migrationId, collectorRoot, discovered: { sources: snapshot.sources.length, rawDocuments: snapshot.articles.length, validArticles: valid.length, skippedArticles: snapshot.articles.length - valid.length, media: snapshot.media.length, mediaBytes: snapshot.media.reduce((sum, item) => sum + item.bytes, 0), artifacts: snapshot.artifacts.length, artifactBytes: snapshot.artifacts.reduce((sum, item) => sum + item.bytes, 0) }, migrated: { sources: 0, rawDocuments: 0, articles: 0, media: 0, artifacts: 0 }, verified: { articleChecksums: 0, mediaChecksums: 0, artifactChecksums: 0 }, media: snapshot.media, artifacts: snapshot.artifacts };
  if (!apply) { console.log(JSON.stringify(report, null, 2)); return; }
  loadEnvLocal(); const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(); const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(); if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  const targetProjectRef = new URL(url).hostname.split(".")[0];
  const confirmation = process.argv.find((value) => value.startsWith("--confirm="))?.slice("--confirm=".length);
  if (confirmation !== `${targetProjectRef}:${migrationId}`) throw new Error(`Apply requires --confirm=${targetProjectRef}:${migrationId}`);
  if (targetProjectRef === productionProjectRef && !process.argv.includes("--allow-production")) throw new Error("Production apply requires --allow-production");
  const configuredProjectRef = process.env.SUPABASE_PROJECT_REF?.trim();
  if (configuredProjectRef && configuredProjectRef !== targetProjectRef) throw new Error("Supabase URL does not match SUPABASE_PROJECT_REF");
  const db = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  async function uploadAndVerify(storagePath: string, bytes: Buffer, mimeType: string): Promise<void> {
    const { error: uploadError } = await db.storage.from("ingestion-raw").upload(storagePath, bytes, { contentType: mimeType, upsert: true });
    if (uploadError) throw uploadError;
    const { data, error: downloadError } = await db.storage.from("ingestion-raw").download(storagePath);
    if (downloadError) throw downloadError;
    const downloaded = Buffer.from(await data.arrayBuffer());
    if (hashBytes(downloaded) !== hashBytes(bytes)) throw new Error(`Checksum verification failed for ${storagePath}`);
  }
  const sourceIds = new Map<string, string>();
  for (const source of snapshot.sources) {
    const type = source.type === "web" ? "website" : source.type; const legacyKey = `${type}:${source.name}`;
    const connectionConfig = type === "telegram" ? { channel: `@${source.name}`, telegramMode: "mtproto", limit: source.limit ?? 20 } : type === "youtube" ? { url: source.url, languages: source.languages, includeTranscript: source.include_transcript, limit: source.limit ?? 10 } : { feedUrl: source.feed_url, url: source.url, limit: source.limit ?? 10 };
    const { data: existing, error: lookupError } = await db.from("ingestion_sources").select("id").eq("legacy_key", legacyKey).maybeSingle(); if (lookupError) throw lookupError;
    if (existing) { sourceIds.set(legacyKey, existing.id); report.migrated.sources += 1; continue; }
    const { data, error } = await db.from("ingestion_sources").insert({ legacy_key: legacyKey, name: source.name, source_type: type, status: "paused", language: "ru", region: "Argentina", categories: source.tags ?? [source.category ?? "travel"], connection_config: connectionConfig as Json, credential_ref: type === "telegram" ? "ARGENTINA_TELEGRAM" : null, schedule_kind: "manual", enabled: false, priority: source.enabled ? 70 : 30, trust_level: source.trust_score ?? 50, legal_notes: "Migrated disabled; connection and reuse rights require verification." }).select("id").single();
    if (error) throw error; sourceIds.set(legacyKey, data.id); report.migrated.sources += 1;
  }
  const telegramSourceId = sourceIds.get("telegram:vista_argentina"); if (!telegramSourceId) throw new Error("Migrated Telegram source not found");
  const runKey = `${migrationId}:${hash({ sources: snapshot.sources, articles: snapshot.articles.map(({ article, message }) => hash({ article, message })), media: snapshot.media.map(({ path: file, checksum }) => [file, checksum]), artifacts: snapshot.artifacts.map(({ path: file, checksum }) => [file, checksum]) })}`; const { data: existingRun, error: existingRunError } = await db.from("ingestion_source_runs").select("id,status").eq("idempotency_key", runKey).maybeSingle(); if (existingRunError) throw existingRunError;
  const runId = existingRun?.id ?? randomUUID(); if (!existingRun) { const { error } = await db.from("ingestion_source_runs").insert({ id: runId, source_id: telegramSourceId, trigger_kind: "migration", status: "processing", idempotency_key: runKey, started_at: new Date().toISOString(), checkpoint_before: {}, counts: {} }); if (error) throw error; }
  if (existingRun) { const { error } = await db.from("ingestion_source_runs").update({ status: "processing", completed_at: null, error_category: null, error_message: null, heartbeat_at: new Date().toISOString() }).eq("id", runId); if (error) throw error; }
  try {
  const storagePaths = new Map<string, string>();
  const mediaByPath = new Map(snapshot.media.map((media) => [media.path, media]));
  for (const media of snapshot.media) {
    const storagePath = `legacy/${media.path}`; const bytes = fs.readFileSync(path.join(collectorRoot, "media", media.path));
    await uploadAndVerify(storagePath, bytes, contentType(media.path));
    const { error: ledgerError } = await db.from("ingestion_migration_ledger").upsert({ migration_id: migrationId, source_system: "argentina-knowledge-collector", entity_type: "media", legacy_id: media.path, target_table: "storage.objects", target_id: storagePath, checksum: media.checksum, status: "verified", error_message: null }, { onConflict: "migration_id,source_system,entity_type,legacy_id" }); if (ledgerError) throw ledgerError;
    storagePaths.set(media.path, storagePath); report.migrated.media += 1; report.verified.mediaChecksums += 1;
  }
  for (const artifact of snapshot.artifacts) {
    const storagePath = `legacy/archive/${storageSafePath(artifact.path)}`; const bytes = fs.readFileSync(path.join(collectorRoot, artifact.path));
    await uploadAndVerify(storagePath, bytes, artifact.contentType);
    const { error: ledgerError } = await db.from("ingestion_migration_ledger").upsert({ migration_id: migrationId, source_system: "argentina-knowledge-collector", entity_type: "artifact", legacy_id: artifact.path, target_table: "storage.objects", target_id: storagePath, checksum: artifact.checksum, status: "verified", error_message: null }, { onConflict: "migration_id,source_system,entity_type,legacy_id" }); if (ledgerError) throw ledgerError;
    report.migrated.artifacts += 1; report.verified.artifactChecksums += 1;
  }
  const rawIds = new Map<string, string>();
  for (const item of snapshot.articles) {
    const article = item.article; const legacyId = `telegram:vista_argentina:${article.id}`; const checksum = hash({ article, message: item.message }); const sourceUrl = /^\d+$/.test(String(article.id)) ? (article.url || `https://t.me/vista_argentina/${article.id}`) : article.url || null; const rawContent = item.message?.text ?? article.text ?? ""; const rawHash = hash({ rawContent, message: item.message, articleId: article.id });
    const media = (article.media ?? []).map((legacyPath) => { const key = mediaKey(legacyPath); const entry = mediaByPath.get(key); return { legacyPath, storagePath: storagePaths.get(key) ?? null, checksum: entry?.checksum ?? null }; });
    const { data: raw, error: rawError } = await db.from("ingestion_raw_documents").upsert({ source_id: telegramSourceId, source_run_id: runId, external_id: String(article.id), version: 1, source_url: sourceUrl, canonical_url: sourceUrl, raw_format: "telegram", raw_content: rawContent || null, raw_payload: { article, message: item.message } as unknown as Json, content_hash: rawHash, media: media as Json, title: article.title || null, author: article.author, language: article.language ?? "ru", source_published_at: item.message?.date ?? article.created_at, source_updated_at: article.updated_at, status: "fetched" }, { onConflict: "source_id,external_id,content_hash" }).select("id").single(); if (rawError) throw rawError;
    rawIds.set(String(article.id), raw.id); report.migrated.rawDocuments += 1;
    const isValid = valid.some((entry) => String(entry.article.id) === String(article.id));
    const { error: rawLedgerError } = await db.from("ingestion_migration_ledger").upsert({ migration_id: migrationId, source_system: "argentina-knowledge-collector", entity_type: "raw_document", legacy_id: legacyId, target_table: "ingestion_raw_documents", target_id: raw.id, checksum, status: isValid ? "verified" : "skipped", error_message: isValid ? null : "No publishable text; retained in private raw archive" }, { onConflict: "migration_id,source_system,entity_type,legacy_id" }); if (rawLedgerError) throw rawLedgerError;
  }
  for (const item of valid) {
    const legacyId = `telegram:vista_argentina:${item.article.id}`; const checksum = hash({ article: item.article, message: item.message }); const { data: ledger, error: ledgerLookupError } = await db.from("ingestion_migration_ledger").select("id,checksum,status").eq("migration_id", migrationId).eq("source_system", "argentina-knowledge-collector").eq("entity_type", "article").eq("legacy_id", legacyId).maybeSingle(); if (ledgerLookupError) throw ledgerLookupError;
    if (ledger?.checksum === checksum && ["migrated", "verified"].includes(ledger.status)) { report.verified.articleChecksums += 1; continue; }
    if (ledger && ledger.checksum !== checksum) throw new Error(`Legacy article changed after migration snapshot: ${legacyId}`);
    const rawId = rawIds.get(String(item.article.id)); if (!rawId) throw new Error(`Raw migration missing for ${legacyId}`);
    const fingerprint = item.article.fingerprint || hash(`${item.article.title}\n${item.article.text}`); const metadata = object(item.article.metadata); const editorial = object(metadata.editorial); const score = Number(metadata.quality_score ?? editorial.score ?? 0); const flags = Array.isArray(editorial.flags) ? editorial.flags.filter((value): value is string => typeof value === "string") : []; const reasons = Array.isArray(editorial.reasons) ? editorial.reasons.filter((value): value is string => typeof value === "string") : [];
    const { data: normalized, error: normalizedError } = await db.from("ingestion_normalized_documents").upsert({ raw_document_id: rawId, source_id: telegramSourceId, source_run_id: runId, title: String(item.article.title), body: String(item.article.text), summary: item.article.summary ?? "", language: item.article.language ?? "ru", category: item.article.category, province: item.article.province, city: item.article.city, tags: item.article.tags ?? [], fingerprint, metadata: { legacyId, legacyFile: path.relative(collectorRoot, item.file), mediaChecksums: (item.article.media ?? []).map(mediaKey).map((key) => mediaByPath.get(key)?.checksum).filter((checksum): checksum is string => Boolean(checksum)) } }, { onConflict: "raw_document_id" }).select("id").single(); if (normalizedError) throw normalizedError;
    const candidateStatus = ["review", "accepted"].includes(item.article.editorial_status ?? "") ? "awaiting_moderation" : "rejected";
    const { data: candidate, error: candidateError } = await db.from("ingestion_candidates").upsert({ normalized_document_id: normalized.id, source_id: telegramSourceId, source_run_id: runId, status: candidateStatus, title: String(item.article.title), summary: item.article.summary ?? "", processed_content: String(item.article.text), language: item.article.language ?? "ru", category: item.article.category, province: item.article.province, city: item.article.city, tags: item.article.tags ?? [], quality_score: Math.max(0, Math.min(100, score)), freshness_score: 0, trust_score: Number(metadata.source_trust_score ?? 45), decision_reasons: reasons, flags: [...flags, "migrated_from_legacy_collector"], suggested_target: "knowledge" }, { onConflict: "normalized_document_id" }).select("id").single(); if (candidateError) throw candidateError;
    const { error: ledgerError } = await db.from("ingestion_migration_ledger").upsert({ migration_id: migrationId, source_system: "argentina-knowledge-collector", entity_type: "article", legacy_id: legacyId, target_table: "ingestion_candidates", target_id: candidate.id, checksum, status: "verified", error_message: null }, { onConflict: "migration_id,source_system,entity_type,legacy_id" }); if (ledgerError) throw ledgerError;
    report.migrated.articles += 1; report.verified.articleChecksums += 1;
  }
  const { error: completionError } = await db.from("ingestion_source_runs").update({ status: "succeeded", completed_at: new Date().toISOString(), heartbeat_at: new Date().toISOString(), counts: { rawDocuments: report.migrated.rawDocuments, candidates: report.migrated.articles, media: report.migrated.media, artifacts: report.migrated.artifacts, verified: report.verified.articleChecksums + report.verified.mediaChecksums + report.verified.artifactChecksums, skipped: report.discovered.skippedArticles } }).eq("id", runId); if (completionError) throw completionError;
  console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    await db.from("ingestion_source_runs").update({ status: "failed", completed_at: new Date().toISOString(), heartbeat_at: new Date().toISOString(), error_category: "migration", error_message: error instanceof Error ? error.message.slice(0, 2000) : "Unknown migration error" }).eq("id", runId);
    throw error;
  }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
