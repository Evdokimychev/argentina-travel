import type { IngestionSourceType, SourceAdapter } from "@/types/ingestion";
import { jsonApiAdapter, manualAdapter, rssAdapter, sitemapAdapter, websiteAdapter } from "@/lib/ingestion/adapters/web";
import { telegramAdapter } from "@/lib/ingestion/adapters/telegram";
import { youtubeAdapter } from "@/lib/ingestion/adapters/youtube";

const adapters: Record<IngestionSourceType, SourceAdapter> = {
  telegram: telegramAdapter, website: websiteAdapter, rss: rssAdapter, sitemap: sitemapAdapter,
  json_api: jsonApiAdapter, youtube: youtubeAdapter, manual: manualAdapter,
};

export function getSourceAdapter(type: IngestionSourceType): SourceAdapter { return adapters[type]; }
export function listSourceAdapters(): SourceAdapter[] { return Object.values(adapters); }
