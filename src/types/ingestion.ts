import type { Json } from "@/types/database";

export const INGESTION_SOURCE_TYPES = [
  "telegram",
  "website",
  "rss",
  "sitemap",
  "json_api",
  "youtube",
  "manual",
] as const;
export type IngestionSourceType = (typeof INGESTION_SOURCE_TYPES)[number];

export const INGESTION_SOURCE_STATUSES = [
  "draft",
  "active",
  "paused",
  "degraded",
  "failed",
  "disabled",
  "archived",
] as const;
export type IngestionSourceStatus = (typeof INGESTION_SOURCE_STATUSES)[number];

export type IngestionScheduleKind = "manual" | "cron" | "interval" | "webhook";
export type IngestionRunStatus =
  | "pending"
  | "fetching"
  | "fetched"
  | "normalizing"
  | "processing"
  | "awaiting_moderation"
  | "approved"
  | "rejected"
  | "publishing"
  | "published"
  | "succeeded"
  | "partial"
  | "failed"
  | "cancelled"
  | "archived";

export type IngestionCandidateStatus =
  | "awaiting_moderation"
  | "approved"
  | "rejected"
  | "deferred"
  | "reprocess"
  | "duplicate"
  | "publishing"
  | "published"
  | "archived";

export type IngestionConnectionConfig = {
  url?: string;
  urls?: string[];
  feedUrl?: string;
  sitemapUrl?: string;
  channel?: string;
  channelId?: string;
  playlistId?: string;
  videoId?: string;
  limit?: number;
  allowedPaths?: string[];
  blockedPaths?: string[];
  selectors?: { title?: string; body?: string; date?: string; author?: string; links?: string };
  discoverLinks?: boolean;
  itemsPath?: string;
  fieldMap?: Record<string, string>;
  languages?: string[];
  includeTranscript?: boolean;
  maxTranscriptSegments?: number;
  fetchFullText?: boolean;
  importMedia?: boolean;
  telegramMode?: "mtproto" | "bot_api";
  historyDepth?: number;
  manualItems?: Array<{ id: string; title?: string; body: string; url?: string; publishedAt?: string }>;
};

export type YouTubeTranscriptSegment = {
  startMs: number;
  endMs: number;
  text: string;
};

export type IngestionSourceRecord = {
  id: string;
  legacyKey: string | null;
  name: string;
  sourceType: IngestionSourceType;
  status: IngestionSourceStatus;
  description: string | null;
  language: string;
  region: string | null;
  categories: string[];
  connectionConfig: IngestionConnectionConfig;
  credentialRef: string | null;
  scheduleKind: IngestionScheduleKind;
  scheduleExpression: string | null;
  enabled: boolean;
  priority: number;
  trustLevel: number;
  legalNotes: string | null;
  rateLimitPerMinute: number;
  retryPolicy: { maxAttempts: number; baseDelaySeconds: number; maxDelaySeconds: number };
  timeoutSeconds: number;
  checkpoint: Record<string, Json | undefined>;
  ownerUserId: string | null;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  nextRunAt: string | null;
  lastError: string | null;
  lastTestedAt: string | null;
  lastTestOk: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type AdapterRawItem = {
  externalId: string;
  sourceUrl?: string;
  canonicalUrl?: string;
  rawFormat: "telegram" | "html" | "rss" | "atom" | "json" | "youtube" | "text" | "markdown";
  rawContent?: string;
  rawPayload?: Json;
  title?: string;
  author?: string;
  language?: string;
  media?: Json[];
  publishedAt?: string;
  updatedAt?: string;
  attachments?: Array<{ filename: string; mimeType: string; bytes: Uint8Array }>;
};

export type NormalizedIngestionDocument = {
  title: string;
  body: string;
  summary: string;
  language: string;
  category: string;
  province: string | null;
  city: string | null;
  tags: string[];
  fingerprint: string;
  sourceUrl: string | null;
  author: string | null;
  publishedAt: string | null;
  metadata: Record<string, Json | undefined>;
};

export type EditorialDecision = {
  status: "accepted" | "review" | "rejected";
  selected: boolean;
  score: number;
  freshnessScore: number;
  breakdown: Record<string, number>;
  reasons: string[];
  flags: string[];
};

export type AdapterValidation = { ok: true } | { ok: false; errors: string[] };
export type AdapterHealth = { ok: boolean; message: string; latencyMs?: number };
export type AdapterFetchResult = {
  items: AdapterRawItem[];
  checkpoint: Record<string, Json | undefined>;
  discovered?: number;
};

export type SourceAdapter = {
  type: IngestionSourceType;
  validateConfig(source: IngestionSourceRecord): AdapterValidation;
  testConnection(source: IngestionSourceRecord): Promise<AdapterHealth>;
  fetch(source: IngestionSourceRecord): Promise<AdapterFetchResult>;
  parse(item: AdapterRawItem, source: IngestionSourceRecord): Promise<AdapterRawItem>;
  normalize(item: AdapterRawItem, source: IngestionSourceRecord): Promise<NormalizedIngestionDocument>;
  checkpoint(result: AdapterFetchResult): Record<string, Json | undefined>;
  healthCheck(source: IngestionSourceRecord): Promise<AdapterHealth>;
};

export type IngestionOverview = {
  generatedAt: string;
  sources: { total: number; active: number; problematic: number; neverSucceeded: number };
  runs: { today: number; running: number; failed: number; averageDurationMs: number | null };
  candidates: { awaitingModeration: number; published: number; duplicates: number };
  queueDepth: number;
  lastHeartbeatAt: string | null;
  health: { database: boolean; scheduler: boolean; storage: boolean; aiProvider: boolean; telegram: boolean; websites: boolean; stuckJobs: number };
};
