import type { TourListing } from "@/types";
import type { ExcursionListing } from "@/types/excursion";
import type {
  PodborAiNarrativeRequest,
  PodborMatchResult,
  PodborRegionResult,
} from "@/types/podbor";
import type { PodborAnswers } from "@/types/podbor";

/** Шаблонное описание маршрута (заменяется OpenAI в `/api/podbor/narrative`). */
export function buildPodborNarrative(result: PodborMatchResult): string {
  const topNames = result.regions.map((r) => r.name);
  const lead = topNames[0] ?? "Аргентина";

  const goalLabel = resolveGoalLabel(result.answers);
  const formatLabel = resolveFormatLabel(result.answers);

  const parts = [
    `Судя по вашим ответам, ${goalLabel.toLowerCase()} лучше всего раскрывается в регионе «${lead}».`,
  ];

  if (topNames.length > 1) {
    parts.push(
      `Логично добавить ${topNames.slice(1).join(" и ")} — так маршрут получится насыщенным, но без суеты.`
    );
  }

  parts.push(
    `На ${result.suggestedDuration.toLowerCase()} при бюджете ${result.budgetLabel.toLowerCase()} на человека я бы заложил ${formatLabel} формат: комфортные переезды, запас на спонтанные открытия и время на месте.`
  );

  parts.push(
    `Оптимальный сезон — ${result.bestSeason}. Если хотите, соберём программу под ваши даты и состав группы.`
  );

  return parts.join(" ");
}

export function buildPodborAiPayload(input: {
  answers: PodborAnswers;
  regions: PodborRegionResult[];
  compatibilityIndex: number;
  suggestedDuration: string;
  budgetLabel: string;
  tours: TourListing[];
  excursions: ExcursionListing[];
}): PodborAiNarrativeRequest {
  return {
    version: 1,
    locale: "ru",
    answers: input.answers,
    topRegions: input.regions.map((r) => ({
      id: r.id,
      name: r.name,
      score: r.score,
    })),
    compatibilityIndex: input.compatibilityIndex,
    suggestedDuration: input.suggestedDuration,
    budgetLabel: input.budgetLabel,
    tourSlugs: input.tours.map((t) => t.slug),
    excursionSlugs: input.excursions.map((e) => e.slug),
  };
}

/** System prompt для будущей интеграции OpenAI. */
export const PODBOR_AI_SYSTEM_PROMPT = `Ты — персональный тревел-консультант сайта «Пора в Аргентину».
Пиши на литературном русском, живо и по делу, без SEO-штампов и англицизмов.
На основе JSON с ответами пользователя составь персональное описание маршрута (3–5 абзацев):
— главный регион и почему он подходит;
— как связать 2–3 региона, если уместно;
— сезон, бюджет, ритм поездки;
— мягкий призыв обсудить программу с организатором.
Не выдумывай цены и визовые правила — опирайся только на переданные данные.`;

function resolveGoalLabel(answers: PodborAnswers): string {
  const id = answers.goal?.[0];
  const map: Record<string, string> = {
    rest: "отдых",
    honeymoon: "медовый месяц",
    family: "семейное путешествие",
    expedition: "экспедиция",
    photo: "фототур",
    relocation: "переезд",
    business: "деловая поездка",
    unknown: "путешествие",
  };
  return map[id ?? ""] ?? "путешествие";
}

function resolveFormatLabel(answers: PodborAnswers): string {
  const id = answers.format?.[0];
  const map: Record<string, string> = {
    comfort: "комфортный",
    premium: "премиальный",
    adventure: "приключенческий",
    active: "активный",
    relaxed: "спокойный",
  };
  return map[id ?? ""] ?? "сбалансированный";
}
