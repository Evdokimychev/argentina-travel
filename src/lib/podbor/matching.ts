import type { TourListing } from "@/types";
import type { ExcursionListing } from "@/types/excursion";
import type {
  PodborAnswers,
  PodborMatchResult,
  PodborRegionId,
} from "@/types/podbor";
import { PODBOR_REGIONS, toRegionResult } from "@/data/podbor/regions";
import { PODBOR_QUESTIONS } from "@/data/podbor/questions";
import {
  computeCompatibilityIndex,
  rankPodborRegions,
  scorePodborRegions,
} from "@/lib/podbor/scoring";
import { buildPodborNarrative, buildPodborAiPayload } from "@/lib/podbor/narrative";

const BUDGET_USD: Record<string, [number, number]> = {
  "under-500": [200, 500],
  "500-1000": [500, 1000],
  "1000-2000": [1000, 2000],
  "2000-5000": [2000, 5000],
  "5000+": [5000, 12000],
};

const DURATION_DAYS: Record<string, [number, number]> = {
  "3-5": [3, 5],
  "5-7": [5, 7],
  "7-10": [7, 10],
  "10-14": [10, 14],
  "14+": [14, 21],
};

function collectAnswerTags(answers: PodborAnswers): Set<string> {
  const tags = new Set<string>();
  for (const [questionId, optionIds] of Object.entries(answers)) {
    const question = PODBOR_QUESTIONS[questionId as keyof typeof PODBOR_QUESTIONS];
    if (!question) continue;
    for (const optionId of optionIds ?? []) {
      const option = question.options.find((o) => o.id === optionId);
      option?.tags?.forEach((tag) => tags.add(tag));
    }
  }
  return tags;
}

function tourMatchesRegion(tour: TourListing, regionId: PodborRegionId): number {
  const meta = PODBOR_REGIONS[regionId];
  const haystack = [
    tour.slug,
    tour.region,
    tour.destination,
    tour.activityType,
    tour.shortDescription ?? "",
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  for (const keyword of meta.tourKeywords) {
    if (haystack.includes(keyword.toLowerCase())) score += 3;
  }
  return score;
}

function scoreTour(
  tour: TourListing,
  regionScores: Record<PodborRegionId, number>,
  tags: Set<string>,
  answers: PodborAnswers
): number {
  let score = 0;

  for (const [regionId, regionScore] of Object.entries(regionScores) as Array<
    [PodborRegionId, number]
  >) {
    score += tourMatchesRegion(tour, regionId) * (regionScore / 5);
  }

  const budgetId = answers.budget?.[0];
  if (budgetId && BUDGET_USD[budgetId]) {
    const [, maxUsd] = BUDGET_USD[budgetId];
    if (tour.priceUsd <= maxUsd * 1.15) score += 4;
    if (tour.priceUsd > maxUsd * 1.5) score -= 3;
  }

  const durationId = answers.duration?.[0];
  if (durationId && DURATION_DAYS[durationId]) {
    const [minD, maxD] = DURATION_DAYS[durationId];
    if (tour.durationDays >= minD - 1 && tour.durationDays <= maxD + 2) score += 5;
  }

  const formatId = answers.format?.[0];
  if (formatId === "premium" && tour.comfortLevel === "Премиум") score += 4;
  if (formatId === "comfort" && tour.comfortLevel === "Комфорт") score += 2;
  if (formatId === "adventure" && /экспед|трек|актив/i.test(tour.activityType)) {
    score += 3;
  }

  const activityId = answers.activity?.[0];
  if (activityId === "minimal" && tour.difficultyLevel === "Лёгкая") score += 3;
  if (activityId === "extreme" && /сложн|экспед/i.test(tour.difficultyLevel)) {
    score += 4;
  }

  if (tags.has("family") && tour.childrenAllowed !== "Только взрослые") score += 3;
  if (tags.has("tango") && tour.slug.includes("tango")) score += 8;
  if (tags.has("wine") && /вин|wine/i.test(tour.activityType)) score += 6;

  return score;
}

function scoreExcursion(
  excursion: ExcursionListing,
  topRegions: PodborRegionId[]
): number {
  let score = 0;
  const citySlug = excursion.citySlug?.toLowerCase() ?? "";
  const title = excursion.title.toLowerCase();

  for (const regionId of topRegions) {
    const meta = PODBOR_REGIONS[regionId];
    if (meta.excursionCitySlugs.some((slug) => citySlug.includes(slug.replace(/-/g, "")))) {
      score += 5;
    }
    for (const keyword of meta.tourKeywords) {
      if (title.includes(keyword.toLowerCase())) score += 2;
    }
  }

  return score;
}

function resolveBudgetLabel(answers: PodborAnswers): string {
  const id = answers.budget?.[0];
  const option = PODBOR_QUESTIONS.budget.options.find((o) => o.id === id);
  return option?.label ?? "1000–2000 $";
}

function resolveDurationLabel(answers: PodborAnswers): string {
  const id = answers.duration?.[0];
  const option = PODBOR_QUESTIONS.duration.options.find((o) => o.id === id);
  return option?.label ?? "7–10 дней";
}

function resolveBestSeason(topRegions: PodborRegionId[]): string {
  if (!topRegions.length) return "март — май и сентябрь — ноябрь";
  const seasons = topRegions.map((id) => PODBOR_REGIONS[id].bestSeason);
  return seasons[0];
}

export function buildPodborMatchResult(
  answers: PodborAnswers,
  tours: TourListing[],
  excursions: ExcursionListing[] = []
): PodborMatchResult {
  const regionScores = scorePodborRegions(answers);
  const ranked = rankPodborRegions(regionScores);
  const topRegionIds = ranked.slice(0, 3).map((r) => r.id);
  const tags = collectAnswerTags(answers);

  const regions = ranked.slice(0, 3).map(({ id, score }) => toRegionResult(id, score));

  const scoredTours = tours
    .map((tour) => ({ tour, score: scoreTour(tour, regionScores, tags, answers) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ tour }) => tour);

  const scoredExcursions = excursions
    .map((excursion) => ({
      excursion,
      score: scoreExcursion(excursion, topRegionIds),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ excursion }) => excursion);

  const compatibilityIndex = computeCompatibilityIndex(regionScores);
  const budgetId = answers.budget?.[0] ?? "1000-2000";
  const budgetUsdRange = BUDGET_USD[budgetId] ?? [1000, 2000];

  const result: PodborMatchResult = {
    compatibilityIndex,
    regions,
    tours: scoredTours,
    excursions: scoredExcursions,
    bestSeason: resolveBestSeason(topRegionIds),
    suggestedDuration: resolveDurationLabel(answers),
    budgetLabel: resolveBudgetLabel(answers),
    budgetUsdRange,
    narrative: "",
    answers,
    aiPayload: buildPodborAiPayload({
      answers,
      regions,
      compatibilityIndex,
      suggestedDuration: resolveDurationLabel(answers),
      budgetLabel: resolveBudgetLabel(answers),
      tours: scoredTours,
      excursions: scoredExcursions,
    }),
  };

  result.narrative = buildPodborNarrative(result);
  return result;
}
