import { rssAdapter } from "@/lib/ingestion/adapters/web";
import { validation, withCommonAdapterMethods } from "@/lib/ingestion/adapters/common";
import { safeFetchText } from "@/lib/ingestion/safe-fetch";
import type { AdapterRawItem, SourceAdapter } from "@/types/ingestion";

function videoIdFromUrl(url: string): string | null { try { const parsed = new URL(url); return parsed.searchParams.get("v") || parsed.pathname.split("/").filter(Boolean).at(-1) || null; } catch { return null; } }

export const youtubeAdapter: SourceAdapter = withCommonAdapterMethods({
  type: "youtube",
  validateConfig: (source) => validation([!source.connectionConfig.channelId && !source.connectionConfig.videoId && !source.connectionConfig.feedUrl && "Укажите channelId, videoId или feedUrl"]),
  fetch: async (source) => {
    const feedUrl = source.connectionConfig.feedUrl || (source.connectionConfig.channelId ? `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(source.connectionConfig.channelId)}` : null);
    let baseItems: AdapterRawItem[] = [];
    if (feedUrl) baseItems = (await rssAdapter.fetch({ ...source, sourceType: "rss", connectionConfig: { ...source.connectionConfig, feedUrl } })).items;
    else if (source.connectionConfig.videoId) baseItems = [{ externalId: source.connectionConfig.videoId, sourceUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(source.connectionConfig.videoId)}`, rawFormat: "youtube" }];
    const items: AdapterRawItem[] = [];
    for (const item of baseItems.slice(0, source.connectionConfig.limit ?? 20)) {
      const videoId = videoIdFromUrl(item.sourceUrl ?? "") ?? item.externalId;
      const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
      let metadata: Record<string, unknown> = {};
      try { metadata = JSON.parse((await safeFetchText(`https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`, source)).text) as Record<string, unknown>; } catch { /* RSS metadata remains usable. */ }
      items.push({ ...item, externalId: videoId, sourceUrl: watchUrl, canonicalUrl: watchUrl, rawFormat: "youtube", title: String(metadata.title ?? item.title ?? "Видео об Аргентине"), author: String(metadata.author_name ?? item.author ?? "") || undefined, rawContent: item.rawContent || String(metadata.title ?? ""), rawPayload: { feed: item.rawPayload ?? {}, oembed: metadata as never, transcriptStatus: source.connectionConfig.includeTranscript ? "unavailable_without_captions_provider" : "not_requested" } });
    }
    return { items, checkpoint: { fetchedAt: new Date().toISOString(), latestVideoId: items[0]?.externalId ?? null } };
  },
});
