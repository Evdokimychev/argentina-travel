import type { TourListing } from "@/types";

export type TourMatchAudience =
  | "family"
  | "couples"
  | "solo"
  | "friends"
  | "seniors";

export type TourMatchPace = "relaxed" | "balanced" | "active" | "intensive";

export type TourMatchFitness = "easy" | "moderate" | "demanding" | "extreme";

export type TourMatchFilters = {
  region?: string;
  budgetMinUsd?: number;
  budgetMaxUsd?: number;
  durationMinDays?: number;
  durationMaxDays?: number;
  dateFrom?: string;
  dateTo?: string;
  groupSize?: number;
  audience?: TourMatchAudience;
  pace?: TourMatchPace;
  fitness?: TourMatchFitness;
  tags?: string[];
};

export type TourMatchIntent = TourMatchFilters & {
  keywords: string[];
  rawQuery: string;
};

export type TourMatchCard = Pick<
  TourListing,
  | "id"
  | "slug"
  | "title"
  | "shortDescription"
  | "image"
  | "priceUsd"
  | "durationDays"
  | "durationNights"
  | "region"
  | "destination"
  | "rating"
  | "reviewCount"
  | "priceOnRequest"
  | "priceFromPrefix"
  | "comfortLevel"
  | "difficultyLevel"
  | "activityType"
>;

export type MatchedTourResult = {
  tour: TourMatchCard;
  score: number;
  explanation: string;
  reasons: string[];
};

export type TourMatchMode = "ai" | "rule_based";

export type TourMatchSessionMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  tourSlugs?: string[];
};

export type TourMatchRequest = {
  query: string;
  filters?: TourMatchFilters;
  sessionId?: string;
};

export type TourMatchResponse = {
  explanation: string;
  tours: MatchedTourResult[];
  sessionId: string;
  mode: TourMatchMode;
  aiConfigured: boolean;
  intent?: Partial<TourMatchIntent>;
};
