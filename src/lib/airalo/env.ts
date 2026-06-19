import path from "node:path";

export type AiraloConfig = {
  feedUrl: string | null;
  feedPath: string | null;
  cacheTtlMs: number;
  affiliateHomeUrl: string | null;
};

export function isAiraloFeedConfigured(): boolean {
  return Boolean(process.env.AIRALO_FEED_URL?.trim() || process.env.AIRALO_FEED_PATH?.trim());
}

export function getAiraloConfig(): AiraloConfig {
  const feedUrl = process.env.AIRALO_FEED_URL?.trim() || null;
  const feedPathRaw = process.env.AIRALO_FEED_PATH?.trim();
  const feedPath = feedPathRaw
    ? path.isAbsolute(feedPathRaw)
      ? feedPathRaw
      : path.join(process.cwd(), feedPathRaw)
    : null;

  const ttlMinutes = Number.parseInt(process.env.AIRALO_FEED_CACHE_MINUTES?.trim() ?? "60", 10);

  return {
    feedUrl,
    feedPath,
    cacheTtlMs: Number.isFinite(ttlMinutes) && ttlMinutes > 0 ? ttlMinutes * 60_000 : 3_600_000,
    affiliateHomeUrl: process.env.AIRALO_AFFILIATE_HOME_URL?.trim() || null,
  };
}
