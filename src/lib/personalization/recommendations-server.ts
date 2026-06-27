import "server-only";

import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { fetchExcursionsServer } from "@/lib/excursion-server";
import {
  fetchRecentInteractions,
  rankInteractionIds,
  type InteractionActor,
} from "@/lib/personalization/interactions-server";
import {
  getRecommendedListings,
  rankSimilarListings,
  scoreTourListingSimilarity,
} from "@/lib/tour-recommendations";
import type { TourListing } from "@/types";
import type { ExcursionListing } from "@/types/excursion";

export type RecommendationContext = InteractionActor & {
  limit?: number;
  /** Preloaded catalog — avoids duplicate fetchMarketplaceTours() on the same page. */
  allTours?: TourListing[];
  /** Preloaded excursions pool for ranking. */
  allExcursions?: ExcursionListing[];
};

function scoreExcursionSimilarity(base: ExcursionListing, candidate: ExcursionListing): number {
  if (base.slug === candidate.slug) return -1;

  let score = 0;
  if (base.citySlug && candidate.citySlug === base.citySlug) score += 45;
  else if (base.cityId && candidate.cityId === base.cityId) score += 35;

  if (base.formatKind && candidate.formatKind === base.formatKind) score += 12;

  const basePrice = base.priceValue ?? 0;
  const candidatePrice = candidate.priceValue ?? 0;
  if (basePrice > 0 && candidatePrice > 0) {
    const ratio = Math.abs(candidatePrice - basePrice) / basePrice;
    if (ratio <= 0.35) score += 15;
    else if (ratio <= 0.7) score += 8;
  }

  score += Math.min(candidate.rating ?? 0, 5) * 2;
  if (candidate.reviewCount >= 5) score += 4;

  return score;
}

function rankSimilarExcursions(
  seeds: ExcursionListing[],
  candidates: ExcursionListing[],
  limit: number
): ExcursionListing[] {
  const exclude = new Set(seeds.map((item) => item.slug));
  const pool = candidates.filter((item) => !exclude.has(item.slug));

  return pool
    .map((candidate) => ({
      candidate,
      score: Math.max(...seeds.map((seed) => scoreExcursionSimilarity(seed, candidate)), 0),
    }))
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.candidate.rating ?? 0) - (a.candidate.rating ?? 0) ||
        b.candidate.reviewCount - a.candidate.reviewCount
    )
    .slice(0, limit)
    .map((item) => item.candidate);
}

function resolveSeedTours(allTours: TourListing[], entityIds: string[]): TourListing[] {
  const bySlug = new Map(allTours.map((tour) => [tour.slug, tour]));
  return entityIds.map((slug) => bySlug.get(slug)).filter((tour): tour is TourListing => Boolean(tour));
}

function resolveSeedExcursions(
  allExcursions: ExcursionListing[],
  entityIds: string[]
): ExcursionListing[] {
  const bySlug = new Map(allExcursions.map((item) => [item.slug, item]));
  return entityIds
    .map((slug) => bySlug.get(slug))
    .filter((item): item is ExcursionListing => Boolean(item));
}

function personalizedTourRank(
  seeds: TourListing[],
  candidate: TourListing,
  recentSlugs: string[]
): number {
  if (seeds.some((seed) => seed.slug === candidate.slug)) return -1;

  const similarity = seeds.length
    ? Math.max(...seeds.map((seed) => scoreTourListingSimilarity(seed, candidate)))
    : 0;

  const recencyBoost = recentSlugs.indexOf(candidate.slug);
  const recencyScore = recencyBoost >= 0 ? Math.max(0, 24 - recencyBoost * 3) : 0;

  return similarity + recencyScore;
}

export async function getRecommendedTours(
  context: RecommendationContext = {}
): Promise<{ tours: TourListing[]; personalized: boolean }> {
  const limit = context.limit ?? 6;
  const allTours = context.allTours ?? (await fetchMarketplaceTours());

  const rows = await fetchRecentInteractions(context, "tour");
  if (!rows.length) {
    return { tours: getRecommendedListings(allTours, limit), personalized: false };
  }

  const viewedIds = rankInteractionIds(rows, "view");
  const favoriteIds = rankInteractionIds(rows, "favorite");
  const seedIds = [...favoriteIds, ...viewedIds.filter((id) => !favoriteIds.includes(id))].slice(
    0,
    8
  );

  const seeds = resolveSeedTours(allTours, seedIds);
  if (!seeds.length) {
    return { tours: getRecommendedListings(allTours, limit), personalized: false };
  }

  const exclude = new Set(seedIds);
  const ranked = allTours
    .filter((tour) => !exclude.has(tour.slug))
    .map((tour) => ({
      tour,
      score: personalizedTourRank(seeds, tour, viewedIds),
    }))
    .filter((item) => item.score >= 0)
    .sort(
      (a, b) =>
        b.score - a.score || b.tour.rating - a.tour.rating || b.tour.reviewCount - a.tour.reviewCount
    )
    .slice(0, limit)
    .map((item) => item.tour);

  if (ranked.length >= limit) {
    return { tours: ranked, personalized: true };
  }

  const fallback = rankSimilarListings(seeds[0], allTours, limit)
    .filter((tour) => !exclude.has(tour.slug) && !ranked.some((item) => item.slug === tour.slug));

  const merged = [...ranked, ...fallback].slice(0, limit);
  if (merged.length) {
    return { tours: merged, personalized: true };
  }

  return { tours: getRecommendedListings(allTours, limit), personalized: false };
}

export async function getRecommendedExcursions(
  context: RecommendationContext = {}
): Promise<{ excursions: ExcursionListing[]; personalized: boolean }> {
  const limit = context.limit ?? 6;
  const { items: allExcursions } =
    context.allExcursions != null
      ? { items: context.allExcursions }
      : await fetchExcursionsServer({ page: 1, pageSize: 120 });

  const rows = await fetchRecentInteractions(context, "excursion");
  if (!rows.length || !allExcursions.length) {
    const featured = [...allExcursions]
      .sort(
        (a, b) =>
          (b.rating ?? 0) - (a.rating ?? 0) ||
          b.reviewCount - a.reviewCount
      )
      .slice(0, limit);
    return { excursions: featured, personalized: false };
  }

  const viewedIds = rankInteractionIds(rows, "view");
  const favoriteIds = rankInteractionIds(rows, "favorite");
  const seedIds = [...favoriteIds, ...viewedIds.filter((id) => !favoriteIds.includes(id))].slice(
    0,
    8
  );

  const seeds = resolveSeedExcursions(allExcursions, seedIds);
  if (!seeds.length) {
    const featured = [...allExcursions]
      .sort(
        (a, b) =>
          (b.rating ?? 0) - (a.rating ?? 0) ||
          b.reviewCount - a.reviewCount
      )
      .slice(0, limit);
    return { excursions: featured, personalized: false };
  }

  const ranked = rankSimilarExcursions(seeds, allExcursions, limit);
  if (ranked.length) {
    return { excursions: ranked, personalized: true };
  }

  const featured = [...allExcursions]
    .sort(
      (a, b) =>
        (b.rating ?? 0) - (a.rating ?? 0) ||
        b.reviewCount - a.reviewCount
    )
    .slice(0, limit);
  return { excursions: featured, personalized: false };
}
