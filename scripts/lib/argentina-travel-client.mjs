/**
 * Клиент Argentina.travel — парсинг данных из HTML (Next.js RSC payload).
 * Официальный туристический портал INPROTUR; фото — CDN api-inprotur-hom.turismo.gob.ar.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const USER_AGENT = "argentina-travel-kb-sync/1.0 (https://www.goargentina.ru)";
const BASE_URL = "https://www.argentina.travel";
const DELAY_MS = 600;
const CDN_PREFIX = "https://api-inprotur-hom.turismo.gob.ar/files/uploads/";

let slugAliasesCache = null;

function getSlugAliases() {
  if (slugAliasesCache) return slugAliasesCache;
  try {
    const raw = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/argentina-travel-slug-aliases.json"), "utf8")
    );
    slugAliasesCache = { ...raw };
    delete slugAliasesCache._comment;
  } catch {
    slugAliasesCache = {};
  }
  return slugAliasesCache;
}

/** Старый slug из листинга провинции → актуальный slug страницы. */
export function resolveSlugAlias(slugEs) {
  return getSlugAliases()[slugEs] ?? slugEs;
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchArgentinaTravelHtml(path) {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return { url, html: await res.text() };
}

/** Собирает декодированный RSC-поток из HTML страницы. */
export function extractRscPayload(html) {
  let raw = "";
  for (const m of html.matchAll(/self\.__next_f\.push\(\[1,"((?:\\.|[^"\\])*)"\]\)/g)) {
    raw += m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  return raw;
}

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\u0026nbsp;/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Извлекает JSON-объект, содержащий позицию typeIdx. */
function extractJsonObjectAt(rsc, typeIdx) {
  const start = rsc.lastIndexOf("{", typeIdx);
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < rsc.length; i++) {
    const ch = rsc[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(rsc.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

const PAGE_TYPES = ["activity", "place"];

/** Все страницы activity/place в RSC-потоке. */
export function parseAllPagesFromRsc(rsc) {
  const pages = [];
  const seen = new Set();
  let searchFrom = 0;

  while (searchFrom < rsc.length) {
    const idx = rsc.indexOf('"type":"', searchFrom);
    if (idx < 0) break;

    const typeMatch = rsc.slice(idx).match(/^"type":"(activity|place)"/);
    if (!typeMatch) {
      searchFrom = idx + 8;
      continue;
    }

    const type = typeMatch[1];
    const raw = extractJsonObjectAt(rsc, idx);
    const slugEs = raw?.slug?.es ?? raw?.slug;
    const key = slugEs ? `${type}:${slugEs}` : null;

    if (raw && key && !seen.has(key)) {
      seen.add(key);
      pages.push({ type, raw });
    }

    searchFrom = idx + 8;
  }

  return pages;
}

/** Главная страница activity/place по slug (не relatedPages). */
export function parsePageFromRsc(rsc, targetSlugEs) {
  const pages = parseAllPagesFromRsc(rsc);
  if (!pages.length) return null;

  if (targetSlugEs) {
    const match = pages.find(
      (p) => p.raw.slug?.es === targetSlugEs || p.raw.slug?.en === targetSlugEs
    );
    if (match) return match;
  }

  // На /actividades/{slug} — первый activity; на /lugares/{slug} — place или activity с тем же slug
  const activity = pages.find((p) => p.type === "activity");
  const place = pages.find((p) => p.type === "place");
  return activity ?? place ?? pages[0];
}

/** @deprecated используйте parsePageFromRsc */
export function parseActivityFromRsc(rsc) {
  const parsed = parsePageFromRsc(rsc);
  return parsed?.type === "activity" ? parsed.raw : parsed?.raw ?? null;
}

/** Список slug со страницы провинции /lugares/{path}. */
export function parseActivitySlugsFromProvinceRsc(rsc) {
  const slugs = new Map();
  for (const page of parseAllPagesFromRsc(rsc)) {
    const es = page.raw.slug?.es;
    const en = page.raw.slug?.en;
    if (!es || !en) continue;
    slugs.set(es, { en, es, pageType: page.type });
  }
  return [...slugs.values()];
}

/** Все CDN-URL внутри объекта страницы (без relatedPages в HTML). */
export function extractUploadUrlsFromObject(obj) {
  const urls = new Set();
  function walk(value) {
    if (typeof value === "string" && value.includes(CDN_PREFIX)) {
      urls.add(value.split("?")[0]);
    } else if (Array.isArray(value)) {
      value.forEach(walk);
    } else if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        if (key === "relatedPages") continue;
        walk(child);
      }
    }
  }
  walk(obj);
  return [...urls];
}

function collectImagesFromContent(content) {
  const images = [];
  for (const block of content ?? []) {
    const type = block.componentType;
    const data = block.data ?? {};

    if (type === "mediaSlider" && data.slides) {
      for (const slide of data.slides) {
        const url = Array.isArray(slide.url) ? slide.url[0] : slide.url;
        if (url) images.push(url);
      }
    }

    if (type === "mediaSingle" && data.url) {
      const url = Array.isArray(data.url) ? data.url[0] : data.url;
      if (url) images.push(url);
    }

    if (type === "mediaGallery" && data.images) {
      for (const img of data.images) {
        const url = Array.isArray(img.url) ? img.url[0] : img.url ?? img;
        if (typeof url === "string") images.push(url);
      }
    }
  }
  return images;
}

function parseAuthorFromFilename(url) {
  const name = url.split("/").pop()?.replace(/\.[a-z]+$/i, "") ?? "";
  const parts = name.split(/__+|_+/).filter(Boolean);
  const authorPart = parts.find(
    (p) =>
      /^[a-z]+_[a-z]+$/i.test(p) ||
      /^[a-z]+ [a-z]+$/i.test(p.replace(/_/g, " "))
  );
  if (!authorPart) return null;
  return authorPart
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function normalizePage(raw, pageType, sourceUrl) {
  const slugEs = raw.slug?.es ?? raw.slug;
  const slugEn = raw.slug?.en ?? slugEs;
  const titleEs = raw.title?.es ?? raw.title ?? "";
  const titleEn = raw.title?.en ?? titleEs;
  const descriptionEs = raw.description?.es ?? "";
  const descriptionEn = raw.description?.en ?? "";

  const paragraphsEs = [];
  const paragraphsEn = [];
  let factsHtmlEs = "";
  let factsHtmlEn = "";

  for (const block of raw.content ?? []) {
    if (block.componentType !== "text" || !block.data?.text) continue;
    const es = block.data.text.es ?? "";
    const en = block.data.text.en ?? "";
    if (/Ubicación geográfica|Geographic location/i.test(es)) {
      factsHtmlEs = es;
      factsHtmlEn = en;
      continue;
    }
    if (stripHtml(es)) paragraphsEs.push(stripHtml(es));
    if (stripHtml(en)) paragraphsEn.push(stripHtml(en));
  }

  const fromContent = collectImagesFromContent(raw.content);
  const fromObject = extractUploadUrlsFromObject(raw);
  const cover = raw.cover ?? raw.hero ?? raw.thumbnail ?? null;
  const allImages = [...new Set([cover, ...fromContent, ...fromObject].filter(Boolean))];

  const images = allImages.map((url, index) => ({
    url,
    author: parseAuthorFromFilename(url),
    role: index === 0 ? "hero" : "gallery",
    sourcePage: sourceUrl,
  }));

  const provinces = (raw.provinces ?? []).map((p) => p.name).filter(Boolean);
  const tags = (raw.tagsXPage ?? raw.tags ?? [])
    .map((t) => (typeof t === "string" ? t : t.name))
    .filter(Boolean);

  return {
    id: raw.id,
    pageType,
    slugEs,
    slugEn,
    sourceUrl,
    titleEs,
    titleEn,
    descriptionEs,
    descriptionEn,
    paragraphsEs,
    paragraphsEn,
    factsHtmlEs,
    factsHtmlEn,
    location: raw.location ?? null,
    provinces,
    tags,
    images,
    cover,
    imageCount: allImages.length,
    updatedAt: raw.updatedAt ?? null,
  };
}

export async function fetchPageBySlug(slugEs) {
  const resolved = resolveSlugAlias(slugEs);
  const attempts = [`/actividades/${resolved}`, `/lugares/${resolved}`];

  for (const path of attempts) {
    const { url, html } = await fetchArgentinaTravelHtml(path);
    const rsc = extractRscPayload(html);
    const parsed = parsePageFromRsc(rsc, resolved);
    if (!parsed?.raw) continue;

    const pageSlug = parsed.raw.slug?.es ?? parsed.raw.slug?.en;
    if (pageSlug && pageSlug !== resolved && parsed.raw.slug?.en !== resolved) continue;

    const page = normalizePage(parsed.raw, parsed.type, url);
    if (slugEs !== resolved) page.slugEsOriginal = slugEs;
    return page;
  }

  throw new Error(`Не удалось распарсить страницу: ${slugEs}`);
}

/** @deprecated */
export async function fetchActivityBySlug(slugEs) {
  return fetchPageBySlug(slugEs);
}

export async function fetchProvinceActivitySlugs(provincePath) {
  const path = `/lugares/${provincePath}`;
  const { html } = await fetchArgentinaTravelHtml(path);
  const rsc = extractRscPayload(html);
  const slugs = parseActivitySlugsFromProvinceRsc(rsc);
  const seen = new Set();
  const out = [];
  for (const s of slugs) {
    const canonical = resolveSlugAlias(s.es);
    if (seen.has(canonical)) continue;
    seen.add(canonical);
    out.push({ ...s, es: canonical, aliasFrom: canonical !== s.es ? s.es : undefined });
  }
  return out;
}

/** Featured-страницы с главной (не всегда есть в листинге провинции). */
export async function discoverHomepageSlugs() {
  const { html } = await fetchArgentinaTravelHtml("/");
  const rsc = extractRscPayload(html);
  const slugs = parseActivitySlugsFromProvinceRsc(rsc);
  return slugs.map((s) => ({
    ...s,
    es: resolveSlugAlias(s.es),
    provinceId: "homepage",
    provincePath: "/",
  }));
}

export async function discoverAllActivitySlugs(provinceDefs) {
  const all = new Map();

  for (const def of provinceDefs) {
    const paths = def.paths ?? [def.id ?? def];
    for (const provincePath of paths) {
      try {
        const slugs = await fetchProvinceActivitySlugs(provincePath);
        for (const s of slugs) {
          if (!all.has(s.es)) {
            all.set(s.es, { ...s, provinceId: def.id ?? provincePath, provincePath });
          }
        }
      } catch (err) {
        console.warn(`[warn] ${provincePath}: ${err.message}`);
      }
      await sleep(DELAY_MS);
    }
  }

  try {
    const home = await discoverHomepageSlugs();
    for (const s of home) {
      if (!all.has(s.es)) all.set(s.es, s);
    }
  } catch (err) {
    console.warn(`[warn] homepage: ${err.message}`);
  }

  return [...all.values()];
}

export async function auditCoverage(provinceDefs) {
  const slugs = await discoverAllActivitySlugs(provinceDefs);
  let fetchOk = 0;
  let fetchFail = 0;
  let totalImages = 0;
  const failures = [];
  const imageCounts = [];

  for (const s of slugs) {
    try {
      const page = await fetchPageBySlug(s.es);
      fetchOk++;
      totalImages += page.imageCount;
      imageCounts.push({ es: s.es, count: page.imageCount, type: page.pageType });
    } catch (err) {
      fetchFail++;
      failures.push({ es: s.es, type: s.pageType, error: err.message });
    }
    await sleep(200);
  }

  return {
    discovered: slugs.length,
    fetchOk,
    fetchFail,
    totalImages,
    avgImagesPerPage: fetchOk ? (totalImages / fetchOk).toFixed(1) : 0,
    failures,
    imageCounts,
  };
}

export { stripHtml, BASE_URL, DELAY_MS, CDN_PREFIX };
