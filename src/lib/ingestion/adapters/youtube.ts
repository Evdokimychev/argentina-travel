import { validation, withCommonAdapterMethods } from "@/lib/ingestion/adapters/common";
import { rssAdapter } from "@/lib/ingestion/adapters/web";
import { safeFetchText } from "@/lib/ingestion/safe-fetch";
import type {
  AdapterRawItem,
  IngestionSourceRecord,
  SourceAdapter,
  YouTubeTranscriptSegment,
} from "@/types/ingestion";

type YouTubeTarget =
  | { kind: "video"; id: string }
  | { kind: "playlist"; id: string }
  | { kind: "channel"; id?: string; url?: string }
  | { kind: "feed"; url: string };

type YouTubeVideoInfo = {
  basic_info?: Record<string, unknown>;
  primary_info?: Record<string, unknown> | null;
  secondary_info?: Record<string, unknown> | null;
  getTranscript?: () => Promise<unknown>;
};

type YouTubeClient = {
  getInfo(target: string): Promise<YouTubeVideoInfo>;
  getChannel(id: string): Promise<unknown>;
  getPlaylist(id: string): Promise<unknown>;
  resolveURL(url: string): Promise<unknown>;
};

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const DEFAULT_TRANSCRIPT_SEGMENT_LIMIT = 5_000;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function textValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (!value || typeof value !== "object") return "";
  const row = value as Record<string, unknown>;
  if (typeof row.text === "string") return row.text.trim();
  if (typeof row.name === "string") return row.name.trim();
  if (typeof row.toString === "function") {
    const result = String(row.toString()).trim();
    return result === "[object Object]" ? "" : result;
  }
  return "";
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const normalized = String(value ?? "").replace(/[^\d.-]/g, "");
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isoDate(value: unknown): string | undefined {
  const text = textValue(value);
  if (!text) return undefined;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function parseYouTubeUrl(rawUrl: string): YouTubeTarget | null {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.toLowerCase();
    if (!YOUTUBE_HOSTS.has(hostname)) return null;

    if (hostname === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? { kind: "video", id } : null;
    }

    if (url.pathname === "/feeds/videos.xml") return { kind: "feed", url: url.toString() };
    const videoId = url.searchParams.get("v");
    if (videoId) return { kind: "video", id: videoId };

    const segments = url.pathname.split("/").filter(Boolean);
    if (["shorts", "embed", "live"].includes(segments[0]) && segments[1]) {
      return { kind: "video", id: segments[1] };
    }

    const playlistId = url.searchParams.get("list");
    if (playlistId) return { kind: "playlist", id: playlistId };
    if (segments[0] === "channel" && segments[1]) return { kind: "channel", id: segments[1] };
    if (segments[0]?.startsWith("@") || ["c", "user"].includes(segments[0])) {
      return { kind: "channel", url: url.toString() };
    }
    return null;
  } catch {
    return null;
  }
}

function sourceTarget(source: IngestionSourceRecord): YouTubeTarget | null {
  if (source.connectionConfig.videoId) return { kind: "video", id: source.connectionConfig.videoId };
  if (source.connectionConfig.playlistId) return { kind: "playlist", id: source.connectionConfig.playlistId };
  if (source.connectionConfig.channelId) return { kind: "channel", id: source.connectionConfig.channelId };
  if (source.connectionConfig.feedUrl) return { kind: "feed", url: source.connectionConfig.feedUrl };
  return source.connectionConfig.url ? parseYouTubeUrl(source.connectionConfig.url) : null;
}

function sourceLimit(source: IngestionSourceRecord): number {
  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(source.connectionConfig.limit ?? DEFAULT_LIMIT)));
}

function safeYouTubeFetch(source: IngestionSourceRecord): typeof fetch {
  const unrestrictedPathSource: IngestionSourceRecord = {
    ...source,
    connectionConfig: { ...source.connectionConfig, allowedPaths: [], blockedPaths: [] },
  };

  return async (input, init) => {
    const request = new Request(input, init);
    const body = request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.clone().arrayBuffer();
    const result = await safeFetchText(request.url, unrestrictedPathSource, {
      method: request.method,
      headers: request.headers,
      body,
    });
    return new Response(result.text, {
      status: 200,
      headers: { "content-type": result.contentType || "application/json; charset=utf-8" },
    });
  };
}

async function createYouTubeClient(source: IngestionSourceRecord): Promise<YouTubeClient> {
  const { Innertube } = await import("youtubei.js");
  return Innertube.create({
    lang: source.connectionConfig.languages?.[0] ?? source.language ?? "es",
    location: "AR",
    timezone: "America/Argentina/Buenos_Aires",
    retrieve_player: false,
    generate_session_locally: true,
    fetch: safeYouTubeFetch(source),
  }) as unknown as YouTubeClient;
}

function videoIdFromNode(value: unknown): string | null {
  const row = asRecord(value);
  const id = row.video_id ?? row.videoId ?? row.id ?? (row.content_type === "VIDEO" ? row.content_id : undefined);
  return typeof id === "string" && id ? id : null;
}

function videoIdFromSeed(item: AdapterRawItem): string {
  const target = item.sourceUrl ? parseYouTubeUrl(item.sourceUrl) : null;
  if (target?.kind === "video") return target.id;
  return item.externalId.replace(/^yt:video:/, "");
}

function videosFromFeed(value: unknown): unknown[] {
  const row = asRecord(value);
  const videos = row.videos;
  if (Array.isArray(videos)) return videos;
  const items = row.items;
  return Array.isArray(items) ? items : [];
}

async function targetVideoIds(client: YouTubeClient, target: YouTubeTarget): Promise<string[]> {
  if (target.kind === "video") return [target.id];
  if (target.kind === "feed") return [];
  if (target.kind === "playlist") {
    const playlist = await client.getPlaylist(target.id);
    return videosFromFeed(playlist).map(videoIdFromNode).filter((id): id is string => Boolean(id));
  }

  let channelId = target.id;
  if (!channelId && target.url) {
    const endpoint = asRecord(await client.resolveURL(target.url));
    channelId = textValue(asRecord(endpoint.payload).browseId ?? asRecord(endpoint.payload).browse_id);
  }
  if (!channelId) throw new Error("YOUTUBE_CHANNEL_NOT_RESOLVED");
  const channel = asRecord(await client.getChannel(channelId));
  const videosFeed = typeof channel.getVideos === "function"
    ? await (channel.getVideos as () => Promise<unknown>)()
    : channel;
  return videosFromFeed(videosFeed).map(videoIdFromNode).filter((id): id is string => Boolean(id));
}

function unseenVideoIds(
  ids: string[],
  source: IngestionSourceRecord,
): { ids: string[]; checkpoint: string | null } {
  const checkpoint = typeof source.checkpoint.latestVideoId === "string"
    ? source.checkpoint.latestVideoId
    : null;
  const boundary = checkpoint ? ids.indexOf(checkpoint) : -1;
  const unseen = boundary >= 0 ? ids.slice(0, boundary) : ids;
  const limit = sourceLimit(source);
  const selected = boundary >= 0 && unseen.length > limit
    ? unseen.slice(unseen.length - limit)
    : unseen.slice(0, limit);
  return { ids: selected, checkpoint: selected[0] ?? checkpoint ?? ids[0] ?? null };
}

function transcriptSegments(value: unknown, limit: number): YouTubeTranscriptSegment[] {
  const transcript = asRecord(value);
  const root = asRecord(transcript.transcript);
  const content = asRecord(root.content);
  const body = asRecord(content.body);
  const initial = Array.isArray(body.initial_segments) ? body.initial_segments : [];
  return initial.flatMap((value): YouTubeTranscriptSegment[] => {
    const row = asRecord(value);
    const text = textValue(row.snippet);
    const startMs = numberValue(row.start_ms);
    const endMs = numberValue(row.end_ms);
    if (!text || startMs === undefined) return [];
    return [{ startMs, endMs: endMs ?? startMs, text }];
  }).slice(0, limit);
}

function timestamp(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1_000));
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

async function oEmbedFallback(videoId: string, source: IngestionSourceRecord): Promise<Record<string, unknown>> {
  const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  try {
    const response = await safeFetchText(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`,
      { ...source, connectionConfig: { ...source.connectionConfig, allowedPaths: [], blockedPaths: [] } },
      { headers: { accept: "application/json" } },
    );
    return JSON.parse(response.text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function videoItem(
  client: YouTubeClient,
  videoId: string,
  source: IngestionSourceRecord,
  seed?: AdapterRawItem,
): Promise<AdapterRawItem> {
  const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  let info: YouTubeVideoInfo | null = null;
  let metadataStatus: "available" | "fallback" = "available";
  try {
    info = await client.getInfo(videoId);
  } catch {
    metadataStatus = "fallback";
  }

  const basic = asRecord(info?.basic_info);
  const primary = asRecord(info?.primary_info);
  const secondary = asRecord(info?.secondary_info);
  const fallback = info ? {} : await oEmbedFallback(videoId, source);
  const title = textValue(basic.title ?? primary.title ?? fallback.title ?? seed?.title) || "Видео об Аргентине";
  const description = textValue(basic.short_description ?? secondary.description ?? seed?.rawContent);
  const author = textValue(basic.author ?? fallback.author_name ?? seed?.author) || undefined;
  const thumbnails = Array.isArray(basic.thumbnail) ? basic.thumbnail.map(asRecord) : [];

  let transcript: YouTubeTranscriptSegment[] = [];
  let transcriptStatus: "not_requested" | "available" | "unavailable" = "not_requested";
  if (source.connectionConfig.includeTranscript) {
    transcriptStatus = "unavailable";
    try {
      if (info?.getTranscript) {
        const transcriptInfo = await info.getTranscript();
        transcript = transcriptSegments(
          transcriptInfo,
          source.connectionConfig.maxTranscriptSegments ?? DEFAULT_TRANSCRIPT_SEGMENT_LIMIT,
        );
        if (transcript.length) transcriptStatus = "available";
      }
    } catch {
      transcriptStatus = "unavailable";
    }
  }

  const transcriptText = transcript.map((segment) => `[${timestamp(segment.startMs)}] ${segment.text}`).join("\n");
  const rawContent = [description, transcriptText].filter(Boolean).join("\n\n") || title;
  const publishedAt = isoDate(primary.published ?? seed?.publishedAt);

  return {
    externalId: videoId,
    sourceUrl: watchUrl,
    canonicalUrl: textValue(basic.url_canonical) || watchUrl,
    rawFormat: "youtube",
    rawContent,
    title,
    author,
    publishedAt,
    rawPayload: {
      youtube: {
        id: videoId,
        metadataStatus,
        title,
        description,
        author: author ?? null,
        channelId: textValue(basic.channel_id) || null,
        durationSeconds: numberValue(basic.duration) ?? null,
        viewCount: numberValue(basic.view_count) ?? null,
        likeCount: numberValue(basic.like_count) ?? null,
        category: textValue(basic.category) || null,
        tags: Array.isArray(basic.tags) ? basic.tags.map(String) : [],
        thumbnailUrl: textValue(thumbnails.at(-1)?.url ?? fallback.thumbnail_url) || null,
        isLive: Boolean(basic.is_live),
      },
      transcript: {
        status: transcriptStatus,
        segments: transcript,
      },
      feed: seed?.rawPayload ?? null,
    },
  };
}

async function feedItems(source: IngestionSourceRecord, feedUrl: string): Promise<AdapterRawItem[]> {
  const result = await rssAdapter.fetch({
    ...source,
    sourceType: "rss",
    connectionConfig: { ...source.connectionConfig, feedUrl, fetchFullText: false, limit: MAX_LIMIT },
  });
  return result.items;
}

export const youtubeAdapter: SourceAdapter = withCommonAdapterMethods({
  type: "youtube",
  validateConfig: (source) => validation([
    !sourceTarget(source) && "Укажите URL YouTube, channelId, playlistId, videoId или feedUrl",
  ]),
  fetch: async (source) => {
    const target = sourceTarget(source);
    if (!target) throw new Error("YOUTUBE_TARGET_REQUIRED");

    let seeds: AdapterRawItem[] = [];
    let client: YouTubeClient;
    try {
      client = await createYouTubeClient(source);
    } catch (error) {
      if (target.kind === "feed") seeds = await feedItems(source, target.url);
      else if (target.kind === "channel" && target.id) {
        seeds = await feedItems(source, `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(target.id)}`);
      } else if (target.kind !== "video") {
        throw error;
      }
      client = {
        getInfo: async () => { throw new Error("YOUTUBEI_UNAVAILABLE"); },
        getChannel: async () => ({}),
        getPlaylist: async () => ({}),
        resolveURL: async () => ({}),
      };
    }

    if (target.kind === "feed" && !seeds.length) seeds = await feedItems(source, target.url);
    let ids = seeds.length
      ? seeds.map(videoIdFromSeed).filter(Boolean)
      : await targetVideoIds(client, target);
    ids = [...new Set(ids)];
    const pending = unseenVideoIds(ids, source);
    const seedById = new Map(seeds.map((item) => [videoIdFromSeed(item), item]));
    const items: AdapterRawItem[] = [];
    for (const videoId of pending.ids) items.push(await videoItem(client, videoId, source, seedById.get(videoId)));

    return {
      items,
      discovered: ids.length,
      checkpoint: { fetchedAt: new Date().toISOString(), latestVideoId: pending.checkpoint },
    };
  },
});
