/**
 * Public tour pages embed a longer plain-text description in JSON-LD (schema.org Event).
 * Partner API `description` is often shorter (intro paragraph only).
 * Activity/comfort blocks live in HTML and are scraped separately.
 */

function normalizeExtractedText(value) {
  const trimmed = value?.replace(/\s+/g, " ").trim();
  return trimmed || undefined;
}

function extractClassText(html, className) {
  const pattern = new RegExp(
    `class="[^"]*${className}[^"]*"[^>]*>([\\s\\S]*?)<\\/(?:div|p|span)>`,
    "i",
  );
  const match = pattern.exec(html);
  if (!match?.[1]) return null;

  const text = match[1]
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
  return text || null;
}

function decodeEmbeddedJsonString(value) {
  return value
    .replace(/\\u003C/gi, "<")
    .replace(/\\u003E/gi, ">")
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .replace(/&nbsp;/gi, " ")
    .trim();
}

function extractEmbeddedEventDescription(html) {
  const match = html.match(
    /"@type"\s*:\s*"Event"[\s\S]*?"description"\s*:\s*"((?:\\.|[^"\\])+)"/,
  );
  if (!match?.[1]) return null;

  const decoded = decodeEmbeddedJsonString(match[1]);
  return decoded.length > 80 ? decoded : null;
}

export function extractPublicSchemaDescription(html) {
  if (!html || typeof html !== "string") return null;

  const scripts = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (scripts?.length) {
    for (const block of scripts) {
      const raw = block.replace(/^[\s\S]*?>/, "").replace(/<\/script>\s*$/i, "").trim();
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw);
        const nodes = Array.isArray(parsed) ? parsed : [parsed];
        for (const node of nodes) {
          const description = node?.description;
          if (typeof description === "string" && description.trim().length > 80) {
            return description.trim();
          }
        }
      } catch {
        // ignore malformed JSON-LD blocks
      }
    }
  }

  return extractEmbeddedEventDescription(html);
}

export function extractPublicDescriptionHtml(html) {
  if (!html?.trim()) return null;

  const match = html.match(
    /class="[^"]*tour-detail-description__text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  );
  const content = match?.[1]?.trim();
  if (!content || content.length < 40) return null;

  return content;
}

export function extractPublicActivityLabel(html) {
  const match = html.match(
    /tour-activity__title-value[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/i,
  );
  return normalizeExtractedText(match?.[1] ?? null);
}

export function extractPublicActivityDescription(html) {
  return normalizeExtractedText(extractClassText(html, "tour-activity__description"));
}

export function extractPublicActivityComment(html) {
  const blocks = [...html.matchAll(/class="[^"]*tour-activity__comment-text[^"]*"[^>]*>([\s\S]*?)<\/(?:div|p|span)>/gi)];
  let best = "";
  for (const match of blocks) {
    const text = (match[1] ?? "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length > best.length) best = text;
  }
  return normalizeExtractedText(best || extractClassText(html, "tour-activity__comment-text"));
}

export function extractPublicComfortDescription(html) {
  return normalizeExtractedText(
    extractClassText(html, "tour-allocation-details__body-description"),
  );
}

export function extractPublicImportantToKnow(html) {
  if (!html?.trim()) return [];

  const blockStart = html.indexOf('class="tour-important-to-know"');
  if (blockStart < 0) return [];

  const blockEnd = html.indexOf("tour-arrival-info", blockStart);
  const block = html.slice(blockStart, blockEnd > blockStart ? blockEnd : blockStart + 50_000);

  const items = [];
  const itemPattern =
    /tour-important-to-know__list-item[\s\S]*?tour-important-to-know__list-item-title[\s\S]*?<span[^>]*>([^<]+)<\/span>[\s\S]*?tour-important-to-know__list-item-body[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;

  for (const match of block.matchAll(itemPattern)) {
    const title = normalizeExtractedText(match[1]);
    const htmlBody = match[2]?.replace(/\s+/g, " ").trim();
    if (title && htmlBody) {
      items.push({ title, html: htmlBody });
    }
  }

  return items;
}

function extractArrivalInfoPoint(block) {
  const labelMatch = block.match(/flex-grow">([^<]+)</);
  const dateMatch = block.match(/ytme-text-m-semibold">([^<]+)</);
  const cityMatch = block.match(/ytme-text-xs-semibold cl-dark-grey-primary">([^<]+)</);

  const label = normalizeExtractedText(labelMatch?.[1] ?? null);
  const date = normalizeExtractedText(dateMatch?.[1]?.replace(/&nbsp;/gi, " ") ?? null);
  const city = normalizeExtractedText(cityMatch?.[1] ?? null);

  if (!label || (!date && !city)) return null;
  return { label, date: date ?? "", city: city ?? "" };
}

export function extractPublicArrivalInfo(html) {
  if (!html?.trim()) return null;

  const blockStart = html.indexOf('class="tour-arrival-info flex flex-wrap"');
  if (blockStart < 0) return null;

  const blockEnd = html.indexOf('</div><!--]--></div><div class="tour-main-section"', blockStart);
  const block = html.slice(
    blockStart,
    blockEnd > blockStart ? blockEnd + 6 : blockStart + 4000,
  );

  const itemBlocks = block
    .split('<div class="tour-arrival-info__item">')
    .slice(1)
    .map((chunk) => chunk.split("</div><!--]--></div>")[0] ?? chunk);

  if (itemBlocks.length < 2) return null;

  const start = extractArrivalInfoPoint(itemBlocks[0]);
  const finish = extractArrivalInfoPoint(itemBlocks[1]);
  if (!start || !finish) return null;

  return { start, finish };
}

function stripHtml(value) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractPublicTourReviews(html) {
  if (!html?.trim()) return [];

  const chunks = html.split(/class="tour-reviews-item"/i).slice(1);
  const reviews = [];

  chunks.forEach((chunk, index) => {
    const slice = chunk.slice(0, 8000);
    const name =
      slice.match(/tour-reviews-item__name[^>]*>([^<]+)</i)?.[1]?.trim() ||
      slice.match(/tour-reviews-item__author[^>]*>([^<]+)</i)?.[1]?.trim();
    const rating = Number.parseFloat(
      slice.match(/tour-reviews-item__rating[^>]*>([\d.,]+)/i)?.[1]?.replace(",", ".") ?? "",
    );
    const date =
      slice.match(/tour-reviews-item__date[^>]*>([^<]+)</i)?.[1]?.trim() ||
      slice.match(/datetime=["']([^"']+)["']/i)?.[1]?.trim();
    const text =
      stripHtml(slice.match(/tour-reviews-item__text[^>]*>([\s\S]*?)<\/(?:div|p)>/i)?.[1] ?? "") ||
      stripHtml(slice.match(/tour-reviews-item__content[^>]*>([\s\S]*?)<\/(?:div|p)>/i)?.[1] ?? "");
    if (!text && !Number.isFinite(rating)) return;

    reviews.push({
      id: `public-${index + 1}`,
      name,
      rating: Number.isFinite(rating) ? rating : undefined,
      created_at: date,
      text,
    });
  });

  return reviews;
}

async function fetchPublicReviewsJson(tourId) {
  const url = `https://youtravel.me/api/v2/tours/public/${encodeURIComponent(String(tourId))}/reviews?lang=ru&limit=50`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "goargentina-youtravel-sync/1.0",
      },
    });
    if (!response.ok) return [];
    const body = await response.json().catch(() => null);
    if (!body || typeof body !== "object") return [];
    const data = body.data;
    if (Array.isArray(data?.reviews)) return data.reviews;
    if (Array.isArray(data)) return data;
    return [];
  } catch {
    return [];
  }
}

export function extractPublicTourPageData(html) {
  if (!html?.trim()) return null;

  return {
    descriptionHtml: extractPublicDescriptionHtml(html) ?? undefined,
    schemaDescription: extractPublicSchemaDescription(html) ?? undefined,
    activityDescription: extractPublicActivityDescription(html),
    activityComment: extractPublicActivityComment(html),
    activityLabel: extractPublicActivityLabel(html),
    comfortDescription: extractPublicComfortDescription(html),
    accommodationPhotos: extractPublicAccommodationPhotos(html),
    importantToKnowItems: extractPublicImportantToKnow(html),
    arrivalInfo: extractPublicArrivalInfo(html) ?? undefined,
    reviews: extractPublicTourReviews(html),
  };
}

function normalizeYouTravelAllocationPhotoUrl(url) {
  const match = url.match(/upload\/allocation\/[a-z0-9/_.-]+\.(?:png|jpe?g|webp)/i);
  if (!match) return url.split("?")[0]?.trim() || url;
  return `https://cf.youtravel.me/${match[0]}`;
}

export function extractPublicAccommodationPhotos(html) {
  if (!html?.trim()) return [];

  const urls = [
    ...html.matchAll(/https:\/\/cf\.youtravel\.me[^"'\\s>]*upload\/allocation[^"'\\s>]*/gi),
  ].map((match) => normalizeYouTravelAllocationPhotoUrl(match[0]));

  return [...new Set(urls)];
}

async function fetchPublicTourHtmlViaCurl(url) {
  try {
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const execFileAsync = promisify(execFile);
    const { stdout } = await execFileAsync(
      "curl",
      [
        "-sL",
        "--max-time",
        "45",
        "-A",
        "Mozilla/5.0 (compatible; goargentina-youtravel-sync/1.0)",
        "-H",
        "Accept: text/html",
        url,
      ],
      { maxBuffer: 12 * 1024 * 1024 },
    );
    return typeof stdout === "string" && stdout.length > 20_000 ? stdout : null;
  } catch {
    return null;
  }
}

const RETRYABLE_HTTP_STATUSES = new Set([429, 502, 503]);
const MIN_PUBLIC_HTML_LENGTH = 20_000;
const PUBLIC_HTML_MARKER = "tour-important-to-know";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isUsablePublicTourHtml(html) {
  return (
    typeof html === "string" &&
    html.length > MIN_PUBLIC_HTML_LENGTH &&
    html.includes(PUBLIC_HTML_MARKER)
  );
}

async function fetchPublicTourHtmlOnce(url, headers) {
  const response = await fetch(url, { headers });
  const html = response.ok ? await response.text() : null;
  return {
    ok: response.ok,
    status: response.status,
    html: isUsablePublicTourHtml(html) ? html : null,
  };
}

async function fetchPublicTourHtmlWithRetry(url, headers, maxAttempts = 3) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const result = await fetchPublicTourHtmlOnce(url, headers);
      if (result.html) return result.html;

      const shouldRetry =
        attempt < maxAttempts - 1 &&
        (result.status == null || RETRYABLE_HTTP_STATUSES.has(result.status));

      if (shouldRetry) {
        await sleep(1000 * 2 ** attempt);
        continue;
      }
      break;
    } catch {
      if (attempt < maxAttempts - 1) {
        await sleep(1000 * 2 ** attempt);
        continue;
      }
    }
  }

  return null;
}

async function fetchPublicTourHtml(tourId, serpLink) {
  const path =
    typeof serpLink === "string" && serpLink.trim().startsWith("/tours/")
      ? serpLink.trim()
      : `/tours/${tourId}`;

  const url = `https://youtravel.me${path}`;
  const headers = {
    Accept: "text/html,application/xhtml+xml",
    "Accept-Language": "ru-RU,ru;q=0.9",
    "User-Agent":
      "Mozilla/5.0 (compatible; goargentina-youtravel-sync/1.0; +https://goargentina.com)",
  };

  const html = await fetchPublicTourHtmlWithRetry(url, headers);
  if (html) return html;

  return fetchPublicTourHtmlViaCurl(url);
}

/** @deprecated Use fetchPublicTourPageData */
export async function fetchPublicSchemaDescription(tourId, serpLink) {
  const html = await fetchPublicTourHtml(tourId, serpLink);
  if (!html) return null;
  return extractPublicSchemaDescription(html);
}

export async function fetchPublicTourPageData(tourId, serpLink) {
  const jsonReviews = await fetchPublicReviewsJson(tourId);
  const html = await fetchPublicTourHtml(tourId, serpLink);
  const data = html ? extractPublicTourPageData(html) : {};
  if (jsonReviews.length) {
    data.reviews = jsonReviews;
  }
  return Object.keys(data).length ? data : null;
}
