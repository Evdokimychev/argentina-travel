import type { PodborAnswers, PodborQuestion, PodborQuestionId } from "@/types/podbor";
import {
  filterSightOptions,
  getQuestionById,
} from "@/data/podbor/questions";

const TAIL: PodborQuestionId[] = [
  "format",
  "duration",
  "budget",
  "travelers",
  "activity",
];

/** Динамический порядок вопросов по ответам. */
export function buildPodborFlow(answers: PodborAnswers): PodborQuestionId[] {
  const goal = answers.goal?.[0];
  const flow: PodborQuestionId[] = ["goal"];

  if (!goal) return flow;

  if (goal === "relocation") {
    flow.push("relocation-priorities", "sights");
  } else if (goal === "business") {
    flow.push("business-priorities", "sights");
  } else {
    flow.push("focus");
    const focus = answers.focus?.[0];

    if (focus === "nature" || focus === "both") {
      flow.push("nature-priorities");
    }
    if (focus === "city" || focus === "both") {
      flow.push("city-priorities");
    }
    if (focus) {
      flow.push("sights");
    }
  }

  return [...flow, ...TAIL];
}

export function resolveActiveQuestion(
  answers: PodborAnswers
): PodborQuestionId | null {
  const flow = buildPodborFlow(answers);

  for (const questionId of flow) {
    const selected = answers[questionId];
    const question = getQuestionById(questionId);

    if (!isQuestionAnswered(question, selected)) {
      return questionId;
    }
  }

  return null;
}

export function isQuestionAnswered(
  question: PodborQuestion,
  selected: string[] | undefined
): boolean {
  if (!selected?.length) return false;
  const min = question.minSelections ?? (question.selectionMode === "multi" ? 1 : 1);
  return selected.length >= min;
}

export function getQuestionForDisplay(
  questionId: PodborQuestionId,
  answers: PodborAnswers
): PodborQuestion {
  const base = getQuestionById(questionId);
  if (questionId !== "sights") return base;

  return {
    ...base,
    options: filterSightOptions(base.options, answers),
  };
}

export function getFlowProgress(
  answers: PodborAnswers,
  currentId: PodborQuestionId | null
): { current: number; total: number; percent: number } {
  const flow = buildPodborFlow(answers);
  const total = flow.length;
  if (!currentId) {
    return { current: total, total, percent: 100 };
  }
  const index = flow.indexOf(currentId);
  const current = index >= 0 ? index + 1 : 1;
  return {
    current,
    total,
    percent: Math.round((current / total) * 100),
  };
}

export function canProceed(
  question: PodborQuestion,
  selected: string[]
): boolean {
  const min = question.minSelections ?? 1;
  const max = question.maxSelections ?? (question.selectionMode === "single" ? 1 : 99);
  return selected.length >= min && selected.length <= max;
}

export function toggleOption(
  question: PodborQuestion,
  current: string[],
  optionId: string
): string[] {
  if (question.selectionMode === "single") {
    return [optionId];
  }

  if (current.includes(optionId)) {
    return current.filter((id) => id !== optionId);
  }

  const max = question.maxSelections ?? 99;
  if (current.length >= max) return current;
  return [...current, optionId];
}
