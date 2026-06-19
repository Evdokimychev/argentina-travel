import { PODBOR_REGIONS, type PodborRegionMeta } from "@/data/podbor/regions";
import { isGuideAssistantAiConfigured } from "@/lib/ai/guide-assistant";
import type { TourListing } from "@/types";
import type {
  MatchedTourResult,
  TourMatchCard,
  TourMatchFilters,
  TourMatchIntent,
  TourMatchMode,
} from "@/types/tour-match";

const QUERY_MAX = 800;
const MIN_RESULTS = 3;
const MAX_RESULTS = 6;

const REGION_ALIASES: Record<string, keyof typeof PODBOR_REGIONS> = {
  патагон: "patagonia",
  patagonia: "patagonia",
  calafate: "patagonia",
  калафате: "patagonia",
  "эль калафате": "patagonia",
  bariloche: "bariloche",
  барилоче: "bariloche",
  игуасу: "iguazu",
  iguazu: "iguazu",
  водопад: "iguazu",
  ушуай: "ushuaia",
  ushuaia: "ushuaia",
  огнен: "ushuaia",
  "buenos aires": "buenos-aires",
  "buenos-aires": "buenos-aires",
  "буэнос": "buenos-aires",
  "буэнос-айрес": "buenos-aires",
  "буэнос айрес": "buenos-aires",
  mendoza: "mendoza",
  мендоз: "mendoza",
  вино: "mendoza",
  wine: "mendoza",
  salta: "salta",
  сальта: "salta",
  северо: "salta",
  jujuy: "salta",
  northwest: "salta",
};

const AUDIENCE_PATTERNS: Array<{ pattern: RegExp; value: TourMatchIntent["audience"] }> = [
  { pattern: /с\s*деть|детей|семь|семей|family|kids/i, value: "family" },
  { pattern: /вдво[её]|пар[ае]|молодож|romantic|honeymoon/i, value: "couples" },
  { pattern: /один|сolo|solo|самостоят/i, value: "solo" },
  { pattern: /друз|компан|friends|групп/i, value: "friends" },
  { pattern: /пожил|senior|без\s*спеш/i, value: "seniors" },
];

const PACE_PATTERNS: Array<{ pattern: RegExp; value: TourMatchIntent["pace"] }> = [
  { pattern: /спокой|relaxed|без\s*спеш|нетороп/i, value: "relaxed" },
  { pattern: /актив|много\s*движ|trek|трек|поход/i, value: "active" },
  { pattern: /интенсив|экспед|насыщ/i, value: "intensive" },
];

const FITNESS_PATTERNS: Array<{ pattern: RegExp; value: TourMatchIntent["fitness"] }> = [
  { pattern: /лёгк|легк|easy|без\s*нагруз/i, value: "easy" },
  { pattern: /умерен|moderate|средн/i, value: "moderate" },
  { pattern: /сложн|demanding|трек|альп/i, value: "demanding" },
  { pattern: /экстрем|extreme|экспед/i, value: "extreme" },
];

const DIFFICULTY_FITNESS: Record<string, TourMatchIntent["fitness"]> = {
  "Лёгкая": "easy",
  "Умеренная": "moderate",
  "Средняя": "moderate",
  "Высокая": "demanding",
  "Экстремальная": "extreme",
};

function normalizeQuery(query: string): string {
  return query.trim().slice(0, QUERY_MAX);
}

function extractBudget(text: string): Pick<TourMatchIntent, "budgetMinUsd" | "budgetMaxUsd"> {
  const lower = text.toLowerCase();
  const range = lower.match(/(\d[\d\s]{2,6})\s*[-–—]\s*(\d[\d\s]{2,6})/);
  if (range) {
    const min = Number.parseInt(range[1].replace(/\s/g, ""), 10);
    const max = Number.parseInt(range[2].replace(/\s/g, ""), 10);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      return { budgetMinUsd: min, budgetMaxUsd: max };
    }
  }

  const upTo = lower.match(/(?:до|не\s*более|max)\s*\$?\s*(\d[\d\s]{2,6})/i);
  if (upTo) {
    const max = Number.parseInt(upTo[1].replace(/\s/g, ""), 10);
    if (Number.isFinite(max)) return { budgetMaxUsd: max };
  }

  const from = lower.match(/(?:от|from)\s*\$?\s*(\d[\d\s]{2,6})/i);
  if (from) {
    const min = Number.parseInt(from[1].replace(/\s/g, ""), 10);
    if (Number.isFinite(min)) return { budgetMinUsd: min };
  }

  const dollars = [...lower.matchAll(/\$?\s*(\d[\d\s]{3,6})\s*(?:\$|usd|долл|бакс)/gi)];
  if (dollars.length > 0) {
    const values = dollars
      .map((match) => Number.parseInt(match[1].replace(/\s/g, ""), 10))
      .filter(Number.isFinite);
    if (values.length === 1) return { budgetMaxUsd: values[0] };
    if (values.length >= 2) {
      return { budgetMinUsd: Math.min(...values), budgetMaxUsd: Math.max(...values) };
    }
  }

  return {};
}

function extractDuration(text: string): Pick<TourMatchIntent, "durationMinDays" | "durationMaxDays"> {
  const lower = text.toLowerCase();

  const weekMatch = lower.match(/(\d+)\s*(?:недел|week)/i);
  if (weekMatch) {
    const weeks = Number.parseInt(weekMatch[1], 10);
    if (Number.isFinite(weeks)) {
      const days = weeks * 7;
      return { durationMinDays: days - 1, durationMaxDays: days + 1 };
    }
  }

  const range = lower.match(/(\d+)\s*[-–—]\s*(\d+)\s*(?:дн|day)/i);
  if (range) {
    const min = Number.parseInt(range[1], 10);
    const max = Number.parseInt(range[2], 10);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      return { durationMinDays: min, durationMaxDays: max };
    }
  }

  const days = lower.match(/(\d+)\s*(?:дн|day)/i);
  if (days) {
    const value = Number.parseInt(days[1], 10);
    if (Number.isFinite(value)) {
      return { durationMinDays: Math.max(1, value - 1), durationMaxDays: value + 1 };
    }
  }

  if (/выходн|weekend|3\s*дня/i.test(lower)) {
    return { durationMinDays: 2, durationMaxDays: 4 };
  }

  return {};
}

function extractRegion(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const [alias, regionId] of Object.entries(REGION_ALIASES)) {
    if (lower.includes(alias)) return regionId;
  }

  for (const meta of Object.values(PODBOR_REGIONS) as PodborRegionMeta[]) {
    if (lower.includes(meta.name.toLowerCase())) return meta.id;
    for (const keyword of meta.tourKeywords) {
      if (lower.includes(keyword.toLowerCase())) return meta.id;
    }
  }

  return undefined;
}

function extractGroupSize(text: string): number | undefined {
  const match = text.match(/(\d+)\s*(?:челов|чел|people|guests|участ)/i);
  if (match) {
    const size = Number.parseInt(match[1], 10);
    if (Number.isFinite(size) && size > 0 && size <= 40) return size;
  }
  if (/вдво[её]|пара/i.test(text)) return 2;
  if (/семь/i.test(text)) return 4;
  return undefined;
}

export function parseTourMatchIntent(
  query: string,
  filters: TourMatchFilters = {}
): TourMatchIntent {
  const rawQuery = normalizeQuery(query);
  const lower = rawQuery.toLowerCase();
  const keywords = lower.split(/[\s,.;:!?]+/).filter((word) => word.length > 2);

  const audience =
    filters.audience ??
    AUDIENCE_PATTERNS.find(({ pattern }) => pattern.test(rawQuery))?.value;
  const pace =
    filters.pace ?? PACE_PATTERNS.find(({ pattern }) => pattern.test(rawQuery))?.value;
  const fitness =
    filters.fitness ?? FITNESS_PATTERNS.find(({ pattern }) => pattern.test(rawQuery))?.value;

  const extractedBudget = extractBudget(rawQuery);
  const extractedDuration = extractDuration(rawQuery);

  return {
    rawQuery,
    keywords,
    region: filters.region ?? extractRegion(rawQuery),
    groupSize: filters.groupSize ?? extractGroupSize(rawQuery),
    audience,
    pace,
    fitness,
    budgetMinUsd: filters.budgetMinUsd ?? extractedBudget.budgetMinUsd,
    budgetMaxUsd: filters.budgetMaxUsd ?? extractedBudget.budgetMaxUsd,
    durationMinDays: filters.durationMinDays ?? extractedDuration.durationMinDays,
    durationMaxDays: filters.durationMaxDays ?? extractedDuration.durationMaxDays,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    tags: filters.tags,
  };
}

function inferTourAudience(tour: TourListing): TourMatchIntent["audience"] | undefined {
  if (tour.badges.includes("family")) return "family";
  if (tour.childrenAllowed !== "Только взрослые") return "family";
  if (tour.groupSizeMax <= 4) return "couples";
  if (tour.groupSizeMax >= 12) return "friends";
  return undefined;
}

function inferTourPace(tour: TourListing): TourMatchIntent["pace"] {
  if (tour.durationDays >= 10 && tour.difficultyLevel === "Лёгкая") return "relaxed";
  if (/экспед|трек|поход/i.test(tour.activityType)) return "active";
  if (tour.difficultyLevel === "Экстремальная" || tour.difficultyLevel === "Высокая") {
    return "intensive";
  }
  return "balanced";
}

function inferTourFitness(tour: TourListing): TourMatchIntent["fitness"] {
  return DIFFICULTY_FITNESS[tour.difficultyLevel] ?? "moderate";
}

function regionScore(tour: TourListing, regionId?: string): { score: number; reason?: string } {
  if (!regionId) return { score: 0 };
  const meta = PODBOR_REGIONS[regionId as keyof typeof PODBOR_REGIONS];
  if (!meta) return { score: 0 };

  const haystack = [
    tour.slug,
    tour.region,
    tour.destination,
    tour.title,
    tour.shortDescription,
    tour.activityType,
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  for (const keyword of meta.tourKeywords) {
    if (haystack.includes(keyword.toLowerCase())) score += 4;
  }
  if (haystack.includes(meta.name.toLowerCase())) score += 6;

  if (score <= 0) return { score: 0 };
  return { score, reason: `подходит под регион «${meta.name}»` };
}

function budgetScore(
  tour: TourListing,
  intent: TourMatchIntent
): { score: number; reason?: string } {
  if (tour.priceOnRequest) return { score: 1, reason: "цена по запросу — уточняйте у организатора" };
  const { budgetMinUsd, budgetMaxUsd } = intent;
  if (budgetMaxUsd == null && budgetMinUsd == null) return { score: 0 };

  if (budgetMaxUsd != null && tour.priceUsd <= budgetMaxUsd * 1.1) {
    return { score: 5, reason: `укладывается в бюджет до ${budgetMaxUsd.toLocaleString("ru-RU")} $` };
  }
  if (budgetMaxUsd != null && tour.priceUsd > budgetMaxUsd * 1.35) {
    return { score: -4 };
  }
  if (budgetMinUsd != null && tour.priceUsd >= budgetMinUsd * 0.85) {
    return { score: 2 };
  }
  return { score: 0 };
}

function durationScore(
  tour: TourListing,
  intent: TourMatchIntent
): { score: number; reason?: string } {
  const { durationMinDays, durationMaxDays } = intent;
  if (durationMinDays == null && durationMaxDays == null) return { score: 0 };

  const min = durationMinDays ?? 1;
  const max = durationMaxDays ?? 30;
  if (tour.durationDays >= min - 1 && tour.durationDays <= max + 2) {
    return {
      score: 5,
      reason: `длительность ${tour.durationDays} дн. близка к вашему запросу`,
    };
  }
  if (tour.durationDays < min - 2) return { score: -2 };
  if (tour.durationDays > max + 4) return { score: -1 };
  return { score: 0 };
}

function audienceScore(
  tour: TourListing,
  intent: TourMatchIntent
): { score: number; reason?: string } {
  if (!intent.audience) return { score: 0 };
  const tourAudience = inferTourAudience(tour);
  if (intent.audience === "family") {
    if (tour.childrenAllowed !== "Только взрослые" || tour.badges.includes("family")) {
      return { score: 4, reason: "подходит для путешествия с детьми" };
    }
    return { score: -3 };
  }
  if (intent.audience === "couples" && tour.groupSizeMax <= 8) {
    return { score: 2, reason: "комфортный формат для пары" };
  }
  if (intent.audience === tourAudience) {
    return { score: 3, reason: "совпадает с составом группы" };
  }
  return { score: 0 };
}

function paceScore(tour: TourListing, intent: TourMatchIntent): { score: number; reason?: string } {
  if (!intent.pace) return { score: 0 };
  const tourPace = inferTourPace(tour);
  if (intent.pace === tourPace) {
    return { score: 3, reason: "темп программы совпадает с запросом" };
  }
  if (intent.pace === "relaxed" && tourPace === "intensive") return { score: -3 };
  if (intent.pace === "active" && tourPace === "relaxed") return { score: -2 };
  return { score: 1 };
}

function fitnessScore(
  tour: TourListing,
  intent: TourMatchIntent
): { score: number; reason?: string } {
  if (!intent.fitness) return { score: 0 };
  const tourFitness = inferTourFitness(tour);
  const order = ["easy", "moderate", "demanding", "extreme"];
  const wanted = order.indexOf(intent.fitness);
  const actual = order.indexOf(tourFitness ?? "moderate");
  const delta = Math.abs(wanted - actual);
  if (delta === 0) {
    return { score: 4, reason: `уровень нагрузки: ${tour.difficultyLevel.toLowerCase()}` };
  }
  if (delta === 1) return { score: 2 };
  if (delta >= 2) return { score: -3 };
  return { score: 0 };
}

function keywordScore(tour: TourListing, intent: TourMatchIntent): number {
  if (intent.keywords.length === 0) return 0;
  const haystack = [
    tour.title,
    tour.shortDescription,
    tour.activityType,
    tour.region,
    tour.destination,
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  for (const keyword of intent.keywords) {
    if (haystack.includes(keyword)) score += 1.5;
  }
  return score;
}

function dateScore(tour: TourListing, intent: TourMatchIntent): number {
  if (!intent.dateFrom && !intent.dateTo) return 0;
  if (tour.availableDates.length === 0) return 0;
  const from = intent.dateFrom ? new Date(intent.dateFrom).getTime() : 0;
  const to = intent.dateTo ? new Date(intent.dateTo).getTime() : Number.MAX_SAFE_INTEGER;
  const hasSlot = tour.availableDates.some((slot) => {
    const start = new Date(slot.start).getTime();
    return start >= from && start <= to;
  });
  return hasSlot ? 4 : -1;
}

export function scoreTourForIntent(tour: TourListing, intent: TourMatchIntent): MatchedTourResult {
  const parts = [
    regionScore(tour, intent.region),
    budgetScore(tour, intent),
    durationScore(tour, intent),
    audienceScore(tour, intent),
    paceScore(tour, intent),
    fitnessScore(tour, intent),
  ];

  const keywordPart = keywordScore(tour, intent);
  const datePart = dateScore(tour, intent);
  const reasons = parts.map((part) => part.reason).filter(Boolean) as string[];

  let score =
    parts.reduce((sum, part) => sum + part.score, 0) + keywordPart + datePart + tour.rating * 0.4;

  if (tour.featured) score += 1;
  if (tour.isHot) score += 0.5;

  const tourCard: TourMatchCard = {
    id: tour.id,
    slug: tour.slug,
    title: tour.title,
    shortDescription: tour.shortDescription,
    image: tour.image,
    priceUsd: tour.priceUsd,
    durationDays: tour.durationDays,
    durationNights: tour.durationNights,
    region: tour.region,
    destination: tour.destination,
    rating: tour.rating,
    reviewCount: tour.reviewCount,
    priceOnRequest: tour.priceOnRequest,
    priceFromPrefix: tour.priceFromPrefix,
    comfortLevel: tour.comfortLevel,
    difficultyLevel: tour.difficultyLevel,
    activityType: tour.activityType,
  };

  return {
    tour: tourCard,
    score: Math.round(score * 10) / 10,
    explanation: buildTourExplanation(tour, reasons),
    reasons,
  };
}

function buildTourExplanation(tour: TourListing, reasons: string[]): string {
  const facts = [
    `${tour.durationDays} дн.`,
    tour.region || tour.destination,
    tour.priceOnRequest
      ? "цена по запросу"
      : `ориентир ${tour.priceUsd.toLocaleString("ru-RU")} $`,
    tour.difficultyLevel.toLowerCase(),
  ].filter(Boolean);

  const reasonText = reasons.length > 0 ? reasons.slice(0, 2).join("; ") : "есть пересечение с вашим запросом";
  return `${tour.title}: ${reasonText}. По карточке тура — ${facts.join(", ")}.`;
}

export function rankToursForIntent(
  tours: TourListing[],
  intent: TourMatchIntent
): MatchedTourResult[] {
  const ranked = tours
    .map((tour) => scoreTourForIntent(tour, intent))
    .sort((a, b) => b.score - a.score);

  const positive = ranked.filter((item) => item.score > 0);
  const pool = positive.length >= MIN_RESULTS ? positive : ranked;

  return pool.slice(0, MAX_RESULTS);
}

export function buildRuleBasedSummary(
  intent: TourMatchIntent,
  results: MatchedTourResult[]
): string {
  if (!intent.rawQuery) {
    return "Опишите, какой тур ищете: регион, бюджет, длительность и состав группы — подберём варианты из каталога.";
  }

  if (results.length === 0) {
    return `По запросу «${intent.rawQuery}» в каталоге не нашлось близких туров. Попробуйте смягчить бюджет или указать другой регион — мы покажем ближайшие варианты.`;
  }

  const hints: string[] = [];
  if (intent.region) {
    const meta = PODBOR_REGIONS[intent.region as keyof typeof PODBOR_REGIONS];
    hints.push(meta ? `регион: ${meta.name}` : `регион: ${intent.region}`);
  }
  if (intent.budgetMaxUsd) hints.push(`бюджет до ${intent.budgetMaxUsd.toLocaleString("ru-RU")} $`);
  if (intent.durationMaxDays) hints.push(`около ${intent.durationMaxDays} дней`);
  if (intent.audience === "family") hints.push("с детьми");

  const intro =
    hints.length > 0
      ? `Учли ваш запрос (${hints.join(", ")}). `
      : `По запросу «${intent.rawQuery}» мы отобрали туры из каталога. `;

  return `${intro}Ниже — ${results.length} ${results.length === 1 ? "вариант" : results.length < 5 ? "варианта" : "вариантов"} с пояснением, почему они подходят. Цены и даты уточняйте на странице тура перед бронированием.`;
}

async function callOpenAiExplanation(system: string, user: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      max_tokens: 700,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenAI error ${response.status}: ${detail.slice(0, 200)}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("OpenAI returned empty response");
  return text;
}

const TOUR_MATCH_SYSTEM_PROMPT = `Ты — консультант по подбору туров на сайте «Пора в Аргентину». Отвечай на русском языке.

Правила:
- Опирайся только на переданные карточки туров из каталога. Не выдумывай маршруты, цены и даты.
- Кратко объясни, почему эти туры подходят под запрос пользователя.
- Не обещай наличие мест — предложи открыть карточку тура для уточнения.
- Тон: дружелюбный, конкретный, без SEO-штампов.`;

async function generateAiSummary(
  intent: TourMatchIntent,
  results: MatchedTourResult[]
): Promise<string> {
  const tourBlock = results
    .map(
      (item, index) =>
        `[${index + 1}] ${item.tour.title} (${item.tour.region}, ${item.tour.durationDays} дн., ${item.tour.priceOnRequest ? "цена по запросу" : `~${item.tour.priceUsd} $`}, ${item.tour.difficultyLevel})\nПочему: ${item.explanation}`
    )
    .join("\n\n");

  const userPrompt = `Запрос пользователя: ${intent.rawQuery}

Подобранные туры:
${tourBlock || "Туры не найдены."}

Дай короткий вводный абзац (3–5 предложений) на русском: что учли из запроса и почему эти туры в топе. Не перечисляй туры списком — для каждого будет отдельная карточка.`;

  return callOpenAiExplanation(TOUR_MATCH_SYSTEM_PROMPT, userPrompt);
}

export type TourMatchOutput = {
  explanation: string;
  tours: MatchedTourResult[];
  mode: TourMatchMode;
  aiConfigured: boolean;
  intent: TourMatchIntent;
};

export async function matchToursWithAssistant(
  query: string,
  tours: TourListing[],
  filters: TourMatchFilters = {}
): Promise<TourMatchOutput> {
  const intent = parseTourMatchIntent(query, filters);
  const ranked = rankToursForIntent(tours, intent);
  const aiConfigured = isGuideAssistantAiConfigured();

  if (!intent.rawQuery) {
    return {
      explanation: buildRuleBasedSummary(intent, ranked),
      tours: ranked,
      mode: "rule_based",
      aiConfigured,
      intent,
    };
  }

  if (!aiConfigured) {
    return {
      explanation: buildRuleBasedSummary(intent, ranked),
      tours: ranked,
      mode: "rule_based",
      aiConfigured: false,
      intent,
    };
  }

  try {
    const explanation = await generateAiSummary(intent, ranked);
    return {
      explanation,
      tours: ranked,
      mode: "ai",
      aiConfigured: true,
      intent,
    };
  } catch {
    return {
      explanation: buildRuleBasedSummary(intent, ranked),
      tours: ranked,
      mode: "rule_based",
      aiConfigured: true,
      intent,
    };
  }
}

export { isGuideAssistantAiConfigured };
