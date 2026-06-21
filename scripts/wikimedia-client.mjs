/**
 * Wikimedia Commons client for fetch-stock-media.mjs
 * Uses action=query with imageinfo + extmetadata (Artist, LicenseShortName).
 */

const USER_AGENT = "argentina-travel-stock-media/1.0 (https://www.goargentina.ru)";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

export const WIKIMEDIA_MIN_WIDTH = 1200;
export const WIKIMEDIA_PREFERRED_WIDTH = 1600;

function stripHtml(html) {
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

function metaValue(meta, key) {
  const raw = meta?.[key]?.value;
  return raw ? stripHtml(raw) : undefined;
}

function pickDownloadUrl(info, targetWidth) {
  const origWidth = info.width ?? 0;
  if (origWidth >= targetWidth && info.url) return info.url;
  if (info.thumburl) return info.thumburl;
  return info.url ?? "";
}

function parseImageInfo(page, info) {
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
    provider: "wikimedia",
    id: String(page.pageid ?? page.title ?? downloadUrl),
    photoId: page.title?.replace(/^File:/, "") ?? String(page.pageid),
    downloadUrl,
    sourceUrl:
      info.descriptionurl ??
      `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title ?? "")}`,
    author: metaValue(meta, "Artist") ?? "Wikimedia Commons",
    license: metaValue(meta, "LicenseShortName") ?? "See Wikimedia Commons",
    imageTitle: title,
    width,
    height,
  };
}

function scoreResult(result) {
  let score = 0;
  if (result.width >= WIKIMEDIA_PREFERRED_WIDTH) score += 20;
  if (result.height > 0 && result.width >= result.height) score += 5;
  score += Math.min(result.width / 200, 10);
  return score;
}

/**
 * @param {string} query
 * @param {number} [limit]
 * @returns {Promise<Array<{ provider: string; id: string; photoId: string; downloadUrl: string; sourceUrl: string; author: string; license: string; imageTitle?: string; width: number; height: number }>>}
 */
export async function searchWikimedia(query, limit = 12) {
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

  const data = await res.json();
  const pages = data.query?.pages ?? {};
  const results = [];

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
