import type { TourListing } from "@/types";

export const PODBOR_BUDGET_USD: Record<string, [number, number]> = {
  "under-500": [0, 500],
  "500-1000": [501, 1000],
  "1000-2000": [1001, 2000],
  "2000-5000": [2001, 5000],
  "5000+": [5001, 12000],
};

export type PodborBudgetAssessment = {
  tour: TourListing;
  normalizedTotalUsd: number | null;
  status: "within_budget" | "over_budget" | "price_unknown";
  overageUsd: number;
  overagePercent: number;
};

export function resolvePodborBudgetRange(budgetId: string | undefined): [number, number] {
  return PODBOR_BUDGET_USD[budgetId ?? ""] ?? [1001, 2000];
}

export function assessTourForPodborBudget(
  tour: TourListing,
  budgetMaxUsd: number,
  partySize = 1
): PodborBudgetAssessment {
  if (tour.priceOnRequest || !Number.isFinite(tour.priceUsd) || tour.priceUsd <= 0) {
    return {
      tour,
      normalizedTotalUsd: null,
      status: "price_unknown",
      overageUsd: 0,
      overagePercent: 0,
    };
  }

  const normalizedTotalUsd =
    tour.partnerPriceUnit === "per_group"
      ? tour.priceUsd / Math.max(1, partySize)
      : tour.priceUsd;
  const overageUsd = Math.max(0, normalizedTotalUsd - budgetMaxUsd);

  return {
    tour,
    normalizedTotalUsd,
    status: overageUsd > 0 ? "over_budget" : "within_budget",
    overageUsd,
    overagePercent: overageUsd > 0 ? (overageUsd / budgetMaxUsd) * 100 : 0,
  };
}
