import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IngestionConnectionConfig, IngestionSourceRecord } from "@/types/ingestion";

const mocks = vi.hoisted(() => ({
  safeFetchText: vi.fn(),
  assertRobotsAllowed: vi.fn(),
  respectSourceRateLimit: vi.fn(),
}));

vi.mock("@/lib/ingestion/safe-fetch", () => mocks);

import { rssAdapter } from "@/lib/ingestion/adapters/web";

function source(
  connectionConfig: IngestionConnectionConfig,
  checkpoint: IngestionSourceRecord["checkpoint"] = {},
): IngestionSourceRecord {
  return {
    id: "source-rss",
    legacyKey: null,
    name: "Argentina RSS",
    sourceType: "rss",
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
    trustLevel: 75,
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

const feed = `<?xml version="1.0"?>
  <rss version="2.0"><channel>
    <item><guid>new</guid><title>Feed title</title><link>https://example.com/new</link><description>Short feed content</description></item>
    <item><guid>seen</guid><title>Seen</title><link>https://example.com/seen</link><description>Seen content</description></item>
    <item><guid>old</guid><title>Old</title><link>https://example.com/old</link><description>Old content</description></item>
  </channel></rss>`;

describe("rssAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.safeFetchText.mockImplementation(async (url: string) => {
      if (url === "https://example.com/feed.xml") {
        return { text: feed, url, contentType: "application/rss+xml" };
      }
      if (url === "https://example.com/new") {
        return {
          text: `<html><head><title>Page title</title><link rel="canonical" href="/canonical" /></head>
            <body><article><h1>Full article</h1><p>Complete guide to Buenos Aires with practical details.</p></article></body></html>`,
          url,
          contentType: "text/html; charset=utf-8",
        };
      }
      throw new Error("HTTP_503");
    });
  });

  it("opens an RSS entry by default and replaces feed content with full text", async () => {
    const result = await rssAdapter.fetch(source(
      { feedUrl: "https://example.com/feed.xml", limit: 3 },
      { latestExternalId: "seen" },
    ));

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      externalId: "new",
      title: "Full article",
      canonicalUrl: "https://example.com/canonical",
      rawContent: "Full articleComplete guide to Buenos Aires with practical details.",
    });
    expect(result.items[0].rawPayload).toMatchObject({ fullText: { status: "available" } });
    expect(mocks.assertRobotsAllowed).toHaveBeenCalledWith("https://example.com/new", expect.any(Object));
    expect(mocks.safeFetchText).not.toHaveBeenCalledWith("https://example.com/old", expect.anything());
    expect(result.checkpoint.latestExternalId).toBe("new");
    expect(result.discovered).toBe(3);
  });

  it("preserves feed content when the article request fails", async () => {
    const result = await rssAdapter.fetch(source({ feedUrl: "https://example.com/feed.xml", limit: 1 }));

    mocks.safeFetchText.mockImplementation(async (url: string) => {
      if (url.endsWith("feed.xml")) return { text: feed, url, contentType: "application/rss+xml" };
      throw new Error("HTTP_503");
    });
    const fallback = await rssAdapter.fetch(source({ feedUrl: "https://example.com/feed.xml", limit: 1 }));

    expect(result.items[0].rawContent).toContain("Complete guide");
    expect(fallback.items[0].rawContent).toBe("Short feed content");
    expect(fallback.items[0].rawPayload).toMatchObject({
      fullText: { status: "fallback", error: "HTTP_503" },
    });
  });

  it("supports Atom alternate links and an explicit full-text opt-out", async () => {
    const atom = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">
      <entry><id>atom-1</id><title>Atom title</title>
        <link rel="self" href="https://example.com/api/atom-1" />
        <link rel="alternate" href="https://example.com/atom-1" />
        <summary>Atom summary</summary></entry></feed>`;
    mocks.safeFetchText.mockResolvedValue({
      text: atom,
      url: "https://example.com/atom.xml",
      contentType: "application/atom+xml",
    });

    const result = await rssAdapter.fetch(source({
      feedUrl: "https://example.com/atom.xml",
      fetchFullText: false,
      limit: 1,
    }));

    expect(result.items[0]).toMatchObject({
      externalId: "atom-1",
      sourceUrl: "https://example.com/atom-1",
      rawContent: "Atom summary",
      rawFormat: "atom",
    });
    expect(mocks.safeFetchText).toHaveBeenCalledTimes(1);
  });

  it("drains an RSS backlog in limited chunks without advancing past unseen entries", async () => {
    const backlogFeed = `<?xml version="1.0"?><rss version="2.0"><channel>
      <item><guid>newest</guid><link>https://example.com/newest</link><description>Newest</description></item>
      <item><guid>middle</guid><link>https://example.com/middle</link><description>Middle</description></item>
      <item><guid>oldest-new</guid><link>https://example.com/oldest-new</link><description>Oldest new</description></item>
      <item><guid>checkpoint</guid><link>https://example.com/checkpoint</link><description>Seen</description></item>
    </channel></rss>`;
    mocks.safeFetchText.mockResolvedValue({
      text: backlogFeed,
      url: "https://example.com/backlog.xml",
      contentType: "application/rss+xml",
    });

    const result = await rssAdapter.fetch(source(
      { feedUrl: "https://example.com/backlog.xml", fetchFullText: false, limit: 2 },
      { latestExternalId: "checkpoint" },
    ));

    expect(result.items.map((item) => item.externalId)).toEqual(["middle", "oldest-new"]);
    expect(result.checkpoint.latestExternalId).toBe("middle");
  });
});
