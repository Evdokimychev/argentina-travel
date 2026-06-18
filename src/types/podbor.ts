import type { TourListing } from "@/types";
import type { ExcursionListing } from "@/types/excursion";

/** Регионы для начисления баллов подбора. */
export type PodborRegionId =
  | "patagonia"
  | "iguazu"
  | "buenos-aires"
  | "salta"
  | "ushuaia"
  | "mendoza"
  | "bariloche";

export type PodborQuestionId =
  | "goal"
  | "focus"
  | "nature-priorities"
  | "city-priorities"
  | "relocation-priorities"
  | "business-priorities"
  | "sights"
  | "format"
  | "duration"
  | "budget"
  | "travelers"
  | "activity";

export type PodborSelectionMode = "single" | "multi";

export type PodborRegionScores = Partial<Record<PodborRegionId, number>>;

export interface PodborOption {
  id: string;
  label: string;
  description?: string;
  image?: string;
  icon?: string;
  scores?: PodborRegionScores;
  /** Теги для сопоставления с турами и экскурсиями. */
  tags?: string[];
  /** Показывать только при определённых ответах (questionId → option ids). */
  showWhen?: Partial<Record<PodborQuestionId, string[]>>;
}

export interface PodborQuestion {
  id: PodborQuestionId;
  title: string;
  subtitle?: string;
  selectionMode: PodborSelectionMode;
  minSelections?: number;
  maxSelections?: number;
  options: PodborOption[];
}

export type PodborAnswers = Partial<Record<PodborQuestionId, string[]>>;

export interface PodborRegionResult {
  id: PodborRegionId;
  name: string;
  slug: string;
  score: number;
  image: string;
  description: string;
  bestSeason: string;
  idealDuration: string;
  mapX: number;
  mapY: number;
}

export interface PodborMatchResult {
  compatibilityIndex: number;
  regions: PodborRegionResult[];
  tours: TourListing[];
  excursions: ExcursionListing[];
  bestSeason: string;
  suggestedDuration: string;
  budgetLabel: string;
  budgetUsdRange: [number, number];
  narrative: string;
  answers: PodborAnswers;
  /** Готово для отправки в OpenAI — см. PodborAiNarrativeRequest. */
  aiPayload: PodborAiNarrativeRequest;
}

/** Контракт для будущей интеграции с OpenAI. */
export interface PodborAiNarrativeRequest {
  version: 1;
  locale: "ru";
  answers: PodborAnswers;
  topRegions: Array<{ id: PodborRegionId; name: string; score: number }>;
  compatibilityIndex: number;
  suggestedDuration: string;
  budgetLabel: string;
  tourSlugs: string[];
  excursionSlugs: string[];
}

export interface PodborSession {
  answers: PodborAnswers;
  currentQuestionId: PodborQuestionId | null;
  completedAt: string | null;
  updatedAt: string;
}
