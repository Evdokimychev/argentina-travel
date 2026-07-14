/**
 * Перевод ES/EN → RU для контента Argentina.travel.
 * MyMemory (бесплатно, с лимитом) + кэш + глоссарий топонимов.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sleep } from "./argentina-travel-client.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const cachePath = path.join(root, ".cache/argentina-travel-translations.json");

const GLOSSARY = [
  ["Mendoza", "Мендоса"],
  ["Buenos Aires", "Буэнос-Айрес"],
  ["Patagonia", "Патагония"],
  ["Cuyo", "Куйо"],
  ["NOA", "Северо-Запад"],
  ["Litoral", "Северо-Восток (Литораль)"],
  ["Aconcagua", "Аконкагуа"],
  ["Iguazú", "Игуасу"],
  ["Iguazu", "Игуасу"],
  ["Tierra del Fuego", "Огненная Земля"],
  ["Bariloche", "Барилоче"],
  ["Ushuaia", "Ушуайя"],
  ["El Calafate", "Эль-Калафате"],
  ["Perito Moreno", "Перито-Морено"],
  ["Ruta Nacional", "национальная трасса"],
  ["Parque Nacional", "национальный парк"],
  ["Parque Provincial", "провинциальный парк"],
  ["m.s.n.m.", "м над уровнем моря"],
  ["hectáreas", "гектаров"],
  ["hectares", "гектаров"],
];

const SORTED_GLOSSARY = [...GLOSSARY].sort(([a], [b]) => b.length - a.length);
const PROTECTED_FRAGMENT_RE = /(<[^>]*>|https?:\/\/[^\s<]+|www\.[^\s<]+|[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,})/giu;
const LATIN_WITH_CYRILLIC_RE = /(?=[\p{L}\p{M}-]*\p{Script=Latin})(?=[\p{L}\p{M}-]*\p{Script=Cyrillic})[\p{L}\p{M}-]+/gu;

const FACT_LABELS_ES = {
  "Ubicación geográfica": "Географическое положение",
  "Cómo llegar": "Как добраться",
  Superficie: "Площадь",
  Altitud: "Высота",
  Clima: "Климат",
  "Cantidad recomendada de días": "Рекомендуемая длительность",
  "Vestimenta y equipo recomendado": "Одежда и снаряжение",
  Recomendaciones: "Рекомендации",
  "Qué hacer": "Что делать",
};

let cache = {};
let quotaExhausted = false;

function saveCache() {
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2) + "\n");
}

if (fs.existsSync(cachePath)) {
  try {
    cache = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    let purged = 0;
    for (const [k, v] of Object.entries(cache)) {
      if (typeof v === "string" && v.includes("MYMEMORY WARNING")) {
        delete cache[k];
        purged++;
      }
    }
    if (purged) saveCache();
  } catch {
    cache = {};
  }
}

function applyGlossary(text) {
  if (!text) return text;

  return text
    .split(PROTECTED_FRAGMENT_RE)
    .map((fragment, index) => {
      if (index % 2 === 1) return fragment;

      let out = fragment;
      for (const [from, to] of SORTED_GLOSSARY) {
        const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // Unicode letter/number guards prevent short terms such as NOA from
        // being inserted into Latinoamerica while still matching punctuation.
        const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "giu");
        out = out.replace(pattern, to);
      }
      return out;
    })
    .join("");
}

export function applyGlossaryExport(text) {
  return applyGlossary(text);
}

export function findMixedScriptWords(text) {
  return text?.match(LATIN_WITH_CYRILLIC_RE) ?? [];
}

export function translateFromCache(text, langpair = "es|ru") {
  if (!text?.trim()) return null;
  const key = `${langpair}::${text.trim()}`;
  const hit = cache[key];
  if (!hit || hit.includes("MYMEMORY WARNING")) return null;
  return applyGlossary(hit);
}

async function myMemoryTranslate(text, langpair, { cacheOnly = false } = {}) {
  const key = `${langpair}::${text}`;
  if (cache[key] && !cache[key].includes("MYMEMORY WARNING")) return cache[key];
  if (cacheOnly || quotaExhausted) return null;

  const url = new URL("https://api.mymemory.translated.net/get");
  if (text.length > 450) {
    throw new Error(`Translation chunk exceeds MyMemory limit (${text.length} > 450)`);
  }
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", langpair);

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "argentina-travel-kb-sync/1.0" },
  });
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);
  const data = await res.json();
  const translated = data.responseData?.translatedText ?? text;
  if (translated.includes("MYMEMORY WARNING")) {
    quotaExhausted = true;
    return null;
  }
  if (translated.trim() === text.trim()) return null;
  cache[key] = translated;
  saveCache();
  await sleep(350);
  return translated;
}

export async function translateToRu(text, { preferLang = "es", cacheOnly = false } = {}) {
  if (!text?.trim()) return "";
  const langpair = preferLang === "en" ? "en|ru" : "es|ru";

  const cached = translateFromCache(text, langpair);
  if (cached) return cached;

  const chunks = splitTranslationChunks(text);
  const parts = [];
  const failures = [];
  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    if (trimmed.length < 4) {
      parts.push(trimmed);
      continue;
    }
    const chunkCached = translateFromCache(trimmed, langpair);
    if (chunkCached) {
      parts.push(chunkCached);
      continue;
    }
    if (cacheOnly) {
      failures.push(trimmed);
      continue;
    }
    try {
      const translated = await myMemoryTranslate(trimmed, langpair);
      if (translated) parts.push(translated);
      else failures.push(trimmed);
    } catch (error) {
      failures.push(trimmed);
    }
  }
  if (failures.length > 0 || parts.length !== chunks.filter((chunk) => chunk.trim()).length) {
    return "";
  }

  const result = applyGlossary(parts.join(" ").replace(/\s+/g, " ").trim());
  return findMixedScriptWords(result).length === 0 ? result : "";
}

export function splitTranslationChunks(text, maxLength = 450) {
  const sentences = text.match(/[^.!?\n]+[.!?]+|[^.!?\n]+|\n+/g) ?? [text];
  const chunks = [];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    if (trimmed.length <= maxLength) {
      chunks.push(trimmed);
      continue;
    }

    const words = trimmed.split(/\s+/);
    let current = "";
    for (const word of words) {
      if (word.length > maxLength) throw new Error("Translation contains an unsplittable token");
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > maxLength) {
        chunks.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) chunks.push(current);
  }

  return chunks;
}

export async function translateActivity(activity) {
  const summarySource = activity.descriptionEs || activity.descriptionEn;
  const summary = await translateToRu(summarySource, { preferLang: "es" });

  const bodyParagraphs = [];
  const sourceParagraphs =
    activity.paragraphsEs.length > 0 ? activity.paragraphsEs : activity.paragraphsEn;
  const preferLang = activity.paragraphsEs.length > 0 ? "es" : "en";

  for (const p of sourceParagraphs.slice(0, 4)) {
    bodyParagraphs.push(await translateToRu(p, { preferLang }));
  }

  const facts = await parseAndTranslateFacts(activity.factsHtmlEs || activity.factsHtmlEn);

  const title = await translateToRu(activity.titleEs || activity.titleEn, { preferLang: "es" });

  return {
    title: applyGlossary(title),
    titleEs: activity.titleEs,
    titleEn: activity.titleEn,
    summary: applyGlossary(summary),
    bodyParagraphs: bodyParagraphs.map(applyGlossary),
    facts,
    autoTranslated: true,
  };
}

async function parseAndTranslateFacts(html) {
  if (!html) return {};

  const text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<strong>([^<]+)<\/strong>/gi, "**$1**")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

  const out = {};
  for (const [esLabel, ruLabel] of Object.entries(FACT_LABELS_ES)) {
    const re = new RegExp(`\\*\\*${esLabel}[^*]*\\*\\*\\s*:?\\s*([^\\n]+)`, "i");
    const m = text.match(re);
    if (!m) continue;
    const value = m[1].trim();
    out[ruLabel] = applyGlossary(await translateToRu(value, { preferLang: "es" }));
  }
  return out;
}

export function buildRussianBody(translation, activity) {
  const lines = ["## Описание", ""];

  if (translation.bodyParagraphs.length) {
    lines.push(translation.bodyParagraphs.join("\n\n"));
  } else if (translation.summary) {
    lines.push(translation.summary);
  }

  const factEntries = Object.entries(translation.facts ?? {});
  if (factEntries.length) {
    lines.push("", "## Факты", "");
    for (const [label, value] of factEntries) {
      lines.push(`- **${label}:** ${value}`);
    }
  }

  lines.push(
    "",
    "## Источники",
    "",
    `- Официальный портал INPROTUR — [Visit Argentina](${activity.sourceUrl}) (исп.; автоперевод ${new Date().toISOString().slice(0, 10)}, требует редакторской вычитки).`
  );

  if (activity.images.length) {
    lines.push(
      "",
      "> Фотографии взяты с официального туристического портала Argentina.travel (INPROTUR). На сайте указывается источник и автор, если он указан в имени файла на CDN."
    );
  }

  return lines.join("\n");
}
