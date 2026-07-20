import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IngestionConnectionConfig, IngestionSourceRecord } from "@/types/ingestion";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  safeFetchText: vi.fn(),
}));

vi.mock("youtubei.js", () => ({
  Innertube: { create: mocks.create },
}));

vi.mock("@/lib/ingestion/safe-fetch", () => ({
  safeFetchText: mocks.safeFetchText,
  assertRobotsAllowed: vi.fn(),
  respectSourceRateLimit: vi.fn(),
}));

import { youtubeAdapter } from "@/lib/ingestion/adapters/youtube";

function source(
  connectionConfig: IngestionConnectionConfig,
  checkpoint: IngestionSourceRecord["checkpoint"] = {},
): IngestionSourceRecord {
  return {
    id: "source-youtube",
    legacyKey: null,
    name: "YouTube Argentina",
    sourceType: "youtube",
    status: "active",
    description: null,
    language: "es",
    region: "AR",
    categories: ["travel"],
    connectionConfig,
    credentialRef: null,
    scheduleKind: "manual",
    scheduleExpression: null,
    enabled: true,
    priority: 50,
    trustLevel: 80,
    legalNotes: null,
    rateLimitPerMinute: 60_000,
    retryPolicy: { maxAttempts: 3, baseDelaySeconds: 10, maxDelaySeconds: 300 },
    timeoutSeconds: 30,
    checkpoint,
    ownerUserId: null,
    lastRunAt: null,
    lastSuccessAt: null,
    nextRunAt: null,
    lastError: null,
    lastTestedAt: null,
    lastTestOk: null,
    createdAt: "2026-07-20T00:00:00.000Z",
    updatedAt: "2026-07-20T00:00:00.000Z",
  };
}

function videoInfo(id: string) {
  return {
    basic_info: {
      id,
      title: `Video ${id}`,
      short_description: "Guia completa de Buenos Aires",
      author: "Argentina Travel",
      channel_id: "UCargentina",
      duration: 125,
      view_count: 12_345,
      like_count: 987,
      category: "Travel & Events",
      tags: ["Argentina", "Buenos Aires"],
      thumbnail: [{ url: "https://img.youtube.com/low.jpg" }, { url: "https://img.youtube.com/high.jpg" }],
      url_canonical: `https://www.youtube.com/watch?v=${id}`,
    },
    primary_info: { published: "2026-07-01" },
    secondary_info: { description: { text: "Guia completa de Buenos Aires" } },
    getTranscript: vi.fn().mockResolvedValue({
      transcript: {
        content: {
          body: {
            initial_segments: [
              { start_ms: "0", end_ms: "1500", snippet: { text: "Hola Argentina" } },
              { start_ms: "65000", end_ms: "68000", snippet: { text: "Llegamos a Palermo" } },
            ],
          },
        },
      },
    }),
  };
}

function client(overrides: Record<string, unknown> = {}) {
  return {
    getInfo: vi.fn(async (id: string) => videoInfo(id)),
    getChannel: vi.fn(),
    getPlaylist: vi.fn(),
    resolveURL: vi.fn(),
    ...overrides,
  };
}

describe("youtubeAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.safeFetchText.mockResolvedValue({
      text: "{}",
      url: "https://www.youtube.com/youtubei/v1/player",
      contentType: "application/json",
    });
  });

  it("loads a video URL with metadata, stats and timestamped captions", async () => {
    const youtube = client();
    mocks.create.mockResolvedValue(youtube);

    const result = await youtubeAdapter.fetch(source({
      url: "https://youtu.be/video-1",
      includeTranscript: true,
    }));

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      externalId: "video-1",
      title: "Video video-1",
      author: "Argentina Travel",
      publishedAt: "2026-07-01T00:00:00.000Z",
    });
    expect(result.items[0].rawContent).toContain("[00:00] Hola Argentina");
    expect(result.items[0].rawContent).toContain("[01:05] Llegamos a Palermo");
    expect(result.items[0].rawPayload).toMatchObject({
      youtube: { viewCount: 12_345, likeCount: 987, durationSeconds: 125 },
      transcript: {
        status: "available",
        segments: [
          { startMs: 0, endMs: 1500, text: "Hola Argentina" },
          { startMs: 65000, endMs: 68000, text: "Llegamos a Palermo" },
        ],
      },
    });
    expect(result.checkpoint.latestVideoId).toBe("video-1");

    const createOptions = mocks.create.mock.calls[0][0] as { fetch: typeof fetch };
    await createOptions.fetch("https://www.youtube.com/youtubei/v1/player", {
      method: "POST",
      body: "{}",
    });
    expect(mocks.safeFetchText).toHaveBeenCalledWith(
      "https://www.youtube.com/youtubei/v1/player",
      expect.any(Object),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("resolves a channel URL and stops at the previous checkpoint", async () => {
    const getInfo = vi.fn(async (id: string) => videoInfo(id));
    const youtube = client({
      getInfo,
      resolveURL: vi.fn().mockResolvedValue({ payload: { browseId: "UCresolved" } }),
      getChannel: vi.fn().mockResolvedValue({
        getVideos: vi.fn().mockResolvedValue({
          videos: [{ video_id: "new-video" }, { video_id: "seen-video" }, { video_id: "old-video" }],
        }),
      }),
    });
    mocks.create.mockResolvedValue(youtube);

    const result = await youtubeAdapter.fetch(source(
      { url: "https://www.youtube.com/@argentina", limit: 10 },
      { latestVideoId: "seen-video" },
    ));

    expect(youtube.resolveURL).toHaveBeenCalledWith("https://www.youtube.com/@argentina");
    expect(youtube.getChannel).toHaveBeenCalledWith("UCresolved");
    expect(getInfo).toHaveBeenCalledTimes(1);
    expect(result.items.map((item) => item.externalId)).toEqual(["new-video"]);
    expect(result.checkpoint.latestVideoId).toBe("new-video");
  });

  it("loads a playlist URL and enforces the configured limit", async () => {
    const youtube = client({
      getPlaylist: vi.fn().mockResolvedValue({
        items: [{ id: "playlist-1" }, { id: "playlist-2" }, { id: "playlist-3" }],
      }),
    });
    mocks.create.mockResolvedValue(youtube);

    const result = await youtubeAdapter.fetch(source({
      url: "https://www.youtube.com/playlist?list=PLargentina",
      limit: 2,
    }));

    expect(youtube.getPlaylist).toHaveBeenCalledWith("PLargentina");
    expect(result.items.map((item) => item.externalId)).toEqual(["playlist-1", "playlist-2"]);
    expect(result.discovered).toBe(3);
  });

  it("drains a channel backlog in bounded chunks without skipping videos", async () => {
    const youtube = client({
      getChannel: vi.fn().mockResolvedValue({
        getVideos: vi.fn().mockResolvedValue({
          videos: [
            { video_id: "newest" },
            { video_id: "middle" },
            { video_id: "oldest-new" },
            { video_id: "checkpoint" },
          ],
        }),
      }),
    });
    mocks.create.mockResolvedValue(youtube);

    const result = await youtubeAdapter.fetch(source(
      { channelId: "UCargentina", limit: 2 },
      { latestVideoId: "checkpoint" },
    ));

    expect(result.items.map((item) => item.externalId)).toEqual(["middle", "oldest-new"]);
    expect(result.checkpoint.latestVideoId).toBe("middle");
  });

  it("keeps metadata when captions are unavailable", async () => {
    const info = videoInfo("without-captions");
    info.getTranscript.mockRejectedValue(new Error("Captions disabled"));
    mocks.create.mockResolvedValue(client({ getInfo: vi.fn().mockResolvedValue(info) }));

    const result = await youtubeAdapter.fetch(source({
      url: "https://www.youtube.com/watch?v=without-captions",
      includeTranscript: true,
    }));

    expect(result.items[0].rawContent).toBe("Guia completa de Buenos Aires");
    expect(result.items[0].rawPayload).toMatchObject({ transcript: { status: "unavailable", segments: [] } });
  });

  it("falls back to safe oEmbed metadata when youtubei initialization fails", async () => {
    mocks.create.mockRejectedValue(new Error("youtubei unavailable"));
    mocks.safeFetchText.mockResolvedValue({
      text: JSON.stringify({ title: "Fallback title", author_name: "Fallback author" }),
      url: "https://www.youtube.com/oembed",
      contentType: "application/json",
    });

    const result = await youtubeAdapter.fetch(source({ url: "https://www.youtube.com/shorts/fallback-video" }));

    expect(result.items[0]).toMatchObject({
      externalId: "fallback-video",
      title: "Fallback title",
      author: "Fallback author",
    });
    expect(result.items[0].rawPayload).toMatchObject({ youtube: { metadataStatus: "fallback" } });
  });
});
