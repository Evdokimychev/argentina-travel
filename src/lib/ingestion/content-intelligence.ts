import { createHash } from "node:crypto";
import type {
  AdapterRawItem,
  EditorialDecision,
  IngestionSourceRecord,
  NormalizedIngestionDocument,
} from "@/types/ingestion";
import { INGESTION_EDITORIAL_POLICY } from "@/lib/ingestion/policy";

const ARGENTINA_TERMS = [
  "argentina", "аргентин", "buenos aires", "буэнос-айрес", "буэнос айрес",
  "patagonia", "патагон", "mendoza", "мендос", "bariloche", "барилоч",
  "ushuaia", "ушуай", "iguazu", "игуас", "salta", "сальт", "jujuy", "жужу",
];
const UTILITY_TERMS = [
  "как добраться", "стоимость", "цена", "расписание", "маршрут", "совет",
  "важно", "нужно", "адрес", "билет", "документ", "сезон", "час", "день",
];
const PROMO_TERMS = [
  "пишите в личку", "успейте купить", "только сегодня", "по промокоду", "заказать у нас", "реклама",
];

const CATEGORIES: Record<string, string[]> = {
  transport: ["транспорт", "автобус", "поезд", "аэропорт", "перелет", "рейс", "sube", "taxi", "bus"],
  documents: ["виза", "документ", "паспорт", "dni", "миграц", "резиденц"],
  money: ["доллар", "курс", "обмен", "карта", "банк", "наличные", "blue"],
  food: ["ресторан", "кафе", "еда", "мясо", "стейк", "asado", "empanada", "mate"],
  nature: ["парк", "гор", "озер", "озёр", "ледник", "водопад", "патагония", "нацпарк"],
  housing: ["отель", "жилье", "апартаменты", "airbnb", "аренда"],
  safety: ["безопасность", "опасно", "краж", "мошен", "полиция"],
};

const PROVINCES: Array<[string[], string]> = [
  [["buenos aires"], "Buenos Aires"], [["caba"], "CABA"],
  [["rio negro", "río negro", "рио негро"], "Río Negro"],
  [["neuquen", "neuquén", "неукен"], "Neuquén"], [["chubut", "чубут"], "Chubut"],
  [["santa cruz", "санта крус"], "Santa Cruz"],
  [["tierra del fuego", "огненн"], "Tierra del Fuego"],
  [["mendoza", "мендоса"], "Mendoza"], [["salta", "сальта"], "Salta"],
  [["jujuy", "жужуй"], "Jujuy"], [["misiones", "мисьонес"], "Misiones"],
  [["cordoba", "córdoba", "кордова"], "Córdoba"],
];
const CITIES: Array<[string[], string]> = [
  [["bariloche", "барилоче"], "San Carlos de Bariloche"],
  [["el calafate", "эль калафате"], "El Calafate"],
  [["el chalten", "el chaltén", "эль чальтен"], "El Chaltén"],
  [["ushuaia", "ушуай"], "Ushuaia"], [["mendoza", "мендоса"], "Mendoza"],
  [["salta", "сальта"], "Salta"],
  [["iguazu", "iguazú", "игуасу", "puerto iguazu", "puerto iguazú", "пуэрто игуасу"], "Puerto Iguazú"],
  [["buenos aires", "буэнос айрес"], "Buenos Aires"],
];

export function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function contentFingerprint(title: string, body: string): string {
  const normalized = `${title}\n${body}`
    .toLocaleLowerCase("ru")
    .replace(/ё/g, "е")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .trim()
    .replace(/\s+/g, " ");
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

export function detectLocation(text: string): { province: string | null; city: string | null } {
  const haystack = text.toLocaleLowerCase("ru");
  const province = PROVINCES.find(([terms]) => terms.some((term) => haystack.includes(term)))?.[1] ?? null;
  const city = CITIES.find(([terms]) => terms.some((term) => haystack.includes(term)))?.[1] ?? null;
  return { province, city };
}

export function classifyCategory(text: string, hints: string[] = []): string {
  const haystack = text.toLocaleLowerCase("ru");
  for (const [category, terms] of Object.entries(CATEGORIES)) {
    if (terms.some((term) => haystack.includes(term))) return category;
  }
  return hints[0] ?? "travel";
}

export function buildSummary(body: string, limit = 500): string {
  const firstParagraph = normalizeText(body).split("\n\n").find(Boolean) ?? "";
  if (firstParagraph.length <= limit) return firstParagraph;
  const clipped = firstParagraph.slice(0, limit + 1);
  const boundary = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, boundary > 80 ? boundary : limit).trim()}…`;
}

export function normalizeRawItem(
  item: AdapterRawItem,
  source: IngestionSourceRecord,
): NormalizedIngestionDocument {
  const title = normalizeText(item.title ?? "Материал об Аргентине").slice(0, 180);
  const body = normalizeText(item.rawContent ?? "");
  const combined = `${title}\n${body}`;
  const location = detectLocation(combined);
  const category = classifyCategory(combined, source.categories);
  const tags = [...new Set(["argentina", category, ...source.categories, location.province, location.city].filter(Boolean) as string[])];
  return {
    title,
    body,
    summary: buildSummary(body),
    language: item.language ?? source.language,
    category,
    province: location.province,
    city: location.city,
    tags,
    fingerprint: contentFingerprint(title, body),
    sourceUrl: item.canonicalUrl ?? item.sourceUrl ?? null,
    author: item.author ?? null,
    publishedAt: item.publishedAt ?? null,
    metadata: { externalId: item.externalId, rawFormat: item.rawFormat },
  };
}

export function evaluateEditorial(
  document: NormalizedIngestionDocument,
  sourceTrustScore: number,
  mediaCount = 0,
  now = new Date(),
): EditorialDecision {
  const text = document.body.trim();
  const combined = `${document.title}\n${text}`.toLocaleLowerCase("ru");
  const paragraphs = text.split(/\n+/).map((item) => item.trim()).filter(Boolean);
  const sentenceCount = (text.match(/[.!?](?:\s|$)/g) ?? []).length;
  const relevanceHits = ARGENTINA_TERMS.filter((term) => combined.includes(term)).length;
  const relevance = Math.min(25, relevanceHits * 7 + (document.province || document.city ? 7 : 0));
  const substance = Math.min(20, Math.floor(text.length / 110) + Math.min(paragraphs.length, 5) * 2 + Math.min(sentenceCount, 5));
  const utilityHits = UTILITY_TERMS.filter((term) => combined.includes(term)).length;
  const usefulness = Math.min(20, utilityHits * 3 + (/\b\d+[\d.,]*\b/.test(text) ? 4 : 0) + (/^\s*(?:[-*•]|\d+[.)])\s+/m.test(text) ? 4 : 0));
  const trust = Math.max(0, Math.min(100, Math.round(sourceTrustScore)));
  const credibility = Math.min(15, Math.round(trust * 0.12) + (document.author ? 2 : 0) + (document.sourceUrl ? 1 : 0));
  const readability = Math.min(10, (document.title.length >= 8 && document.title.length <= 100 ? 4 : 1) + (paragraphs.length >= 2 ? 3 : 1) + (sentenceCount >= 2 ? 3 : 1));
  const media = mediaCount > 0 ? 5 : 0;
  const ageDays = document.publishedAt ? Math.max(0, Math.floor((now.getTime() - new Date(document.publishedAt).getTime()) / 86_400_000)) : null;
  const freshness = ageDays === null || !Number.isFinite(ageDays) ? 1 : ageDays <= 180 ? 5 : ageDays <= 730 ? 3 : 1;
  const breakdown = { relevance, substance, usefulness, credibility, readability, media, freshness };
  const score = Math.min(100, Object.values(breakdown).reduce((sum, value) => sum + value, 0));
  const reasons: string[] = [];
  const flags: string[] = [];
  if (text.length < INGESTION_EDITORIAL_POLICY.minTextLength) reasons.push(`text_too_short:${text.length}<${INGESTION_EDITORIAL_POLICY.minTextLength}`);
  if (relevance === 0) reasons.push("argentina_relevance_not_found");
  if (PROMO_TERMS.some((term) => combined.includes(term))) flags.push("promotional_language");
  if ((INGESTION_EDITORIAL_POLICY.sensitiveCategories as readonly string[]).includes(document.category) && ageDays !== null && ageDays > INGESTION_EDITORIAL_POLICY.sensitiveMaxAgeDays) flags.push("time_sensitive_content_may_be_stale");
  if (!document.author && !document.sourceUrl) flags.push("source_attribution_incomplete");

  let status: EditorialDecision["status"] = "rejected";
  if (reasons.length === 0 && score >= INGESTION_EDITORIAL_POLICY.acceptedThreshold) status = "accepted";
  else if (reasons.length === 0 && score >= INGESTION_EDITORIAL_POLICY.reviewThreshold) status = "review";
  else if (reasons.length === 0) reasons.push(`quality_score_below_review_threshold:${score}`);
  return { status, selected: status !== "rejected", score, freshnessScore: freshness * 20, breakdown, reasons, flags };
}

function shingles(value: string, size = 3): Set<string> {
  const words = value.toLocaleLowerCase("ru").replace(/ё/g, "е").replace(/[^a-zа-я0-9]+/gi, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length < size) return new Set(words);
  return new Set(words.slice(0, words.length - size + 1).map((_, index) => words.slice(index, index + size).join(" ")));
}

export function contentSimilarity(left: string, right: string): number {
  const leftSet = shingles(left);
  const rightSet = shingles(right);
  if (!leftSet.size || !rightSet.size) return 0;
  let intersection = 0;
  for (const item of leftSet) if (rightSet.has(item)) intersection += 1;
  return intersection / new Set([...leftSet, ...rightSet]).size;
}
