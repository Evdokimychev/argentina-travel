/**
 * Server/script-only Wikimedia Commons client. Do not import from client components.
 */
import type { ImageAttribution } from "./types";

const USER_AGENT = "argentina-travel-image-provider/1.0 (https://www.goargentina.ru)";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

export const WIKIMEDIA_MIN_WIDTH = 1200;
export const WIKIMEDIA_PREFERRED_WIDTH = 1600;

export interface WikimediaSearchResult {
  id: string;
  downloadUrl: string;
  sourceUrl: string;
  authorName: string;
  license: string;
  title?: string;
  width: number;
  height: number;
}

interface CommonsImageInfo {
  url?: string;
  thumburl?: string;
  descriptionurl?: string;
  width?: number;
  height?: number;
  extmetadata?: Record<string, { value?: string }>;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function metaValue(meta: CommonsImageInfo["extmetadata"], key: string): string | undefined {
  const raw = meta?.[key]?.value;
  return raw ? stripHtml(raw) : undefined;
}

function pickDownloadUrl(info: CommonsImageInfo, targetWidth: number): string {
  const origWidth = info.width ?? 0;
  if (origWidth >= targetWidth && info.url) return info.url;
  if (info.thumburl) return info.thumburl;
  return info.url ?? "";
}

function parseImageInfo(page: { pageid?: number; title?: string }, info: CommonsImageInfo): WikimediaSearchResult | null {
  const width = info.width ?? 0;
  const height = info.height ?? 0;
  if (width < WIKIMEDIA_MIN_WIDTH) return null;

  const downloadUrl = pickDownloadUrl(info, WIKIMEDIA_PREFERRED_WIDTH);
  if (!downloadUrl) return null;

  const meta = info.extmetadata;
  const title =
    metaValue(meta, "ObjectName") ??
    metaValue(meta, "ImageDescription")?.slice(0, 120) ??
    page.title?.replace(/^File:/, "");

  return {
    id: String(page.pageid ?? page.title ?? downloadUrl),
    downloadUrl,
    sourceUrl: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title ?? "")}`,
    authorName: metaValue(meta, "Artist") ?? "Wikimedia Commons",
    license: metaValue(meta, "LicenseShortName") ?? "See Wikimedia Commons",
    title,
    width,
    height,
  };
}

function scoreResult(result: WikimediaSearchResult): number {
  let score = 0;
  if (result.width >= WIKIMEDIA_PREFERRED_WIDTH) score += 20;
  if (result.height > 0 && result.width >= result.height) score += 5;
  score += Math.min(result.width / 200, 10);
  return score;
}

export async function searchWikimedia(
  query: string,
  limit: number = 12,
): Promise<WikimediaSearchResult[]> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrsearch: query,
    gsrnamespace: "6",
    gsrlimit: String(limit),
    prop: "imageinfo",
    iiprop: "url|size|extmetadata|mime",
    iiurlwidth: String(WIKIMEDIA_PREFERRED_WIDTH),
  });

  const res = await fetch(`${COMMONS_API}?${params}`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`Wikimedia HTTP ${res.status}`);

  const data = (await res.json()) as {
    query?: { pages?: Record<string, { pageid?: number; title?: string; imageinfo?: CommonsImageInfo[] }> };
  };

  const pages = data.query?.pages ?? {};
  const results: WikimediaSearchResult[] = [];

  for (const page of Object.values(pages)) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    const mime = info.extmetadata?.MIMEtype?.value ?? "";
    if (mime && !mime.startsWith("image/")) continue;
    const parsed = parseImageInfo(page, info);
    if (parsed) results.push(parsed);
  }

  return results.sort((a, b) => scoreResult(b) - scoreResult(a));
}

export function toWikimediaAttribution(result: WikimediaSearchResult): ImageAttribution {
  return {
    authorName: result.authorName,
    sourceUrl: result.sourceUrl,
    license: result.license,
    source: "wikimedia",
  };
}
