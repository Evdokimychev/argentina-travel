import type { PodborAnswers, PodborRegionId } from "@/types/podbor";
import { PODBOR_QUESTIONS } from "@/data/podbor/questions";

/** Суммировать баллы регионов по всем ответам. */
export function scorePodborRegions(
  answers: PodborAnswers
): Record<PodborRegionId, number> {
  const totals = {} as Record<PodborRegionId, number>;

  for (const [questionId, optionIds] of Object.entries(answers)) {
    const question = PODBOR_QUESTIONS[questionId as keyof typeof PODBOR_QUESTIONS];
    if (!question || !optionIds?.length) continue;

    for (const optionId of optionIds) {
      const option = question.options.find((o) => o.id === optionId);
      if (!option?.scores) continue;

      for (const [regionId, points] of Object.entries(option.scores)) {
        const id = regionId as PodborRegionId;
        totals[id] = (totals[id] ?? 0) + (points ?? 0);
      }
    }
  }

  return totals;
}

export function rankPodborRegions(
  scores: Record<PodborRegionId, number>
): Array<{ id: PodborRegionId; score: number }> {
  return (Object.entries(scores) as Array<[PodborRegionId, number]>)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id, score]) => ({ id, score }));
}

/** Индекс совместимости 0–100 относительно лидера рейтинга. */
export function computeCompatibilityIndex(
  scores: Record<PodborRegionId, number>
): number {
  const ranked = rankPodborRegions(scores);
  if (!ranked.length) return 72;

  const top = ranked[0].score;
  const second = ranked[1]?.score ?? 0;
  const spread = top - second;
  const base = Math.min(98, 68 + top * 2);
  const clarityBonus = Math.min(12, spread * 2);
  return Math.round(Math.min(99, base + clarityBonus));
}
