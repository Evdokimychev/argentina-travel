import type { TourDetail, TourListing } from "@/types";
import { getTourFormats } from "@/lib/tour-format";
import { resolveListingOwnerUserId } from "@/lib/organizer-public";
import { getMarketplaceListings } from "@/lib/tour-repository";
import { getTourDetail } from "@/lib/tours";

const PRICE_BAND_RATIO = 0.35;

function priceBandScore(basePrice: number, candidatePrice: number): number {
  if (basePrice <= 0 || candidatePrice <= 0) return 0;
  const ratio = Math.abs(candidatePrice - basePrice) / basePrice;
  if (ratio <= PRICE_BAND_RATIO) return 20;
  if (ratio <= PRICE_BAND_RATIO * 2) return 10;
  return 0;
}

function formatOverlapScore(
  baseFormats: ReturnType<typeof getTourFormats>,
  candidate: TourListing
): number {
  const candidateFormats = getTourFormats(candidate);
  return baseFormats.some((format) => candidateFormats.includes(format)) ? 10 : 0;
}

export function scoreTourListingSimilarity(
  base: TourListing,
  candidate: TourListing
): number {
  if (base.slug === candidate.slug) return -1;

  let score = 0;

  if (base.region && candidate.region === base.region) score += 40;
  else if (base.destination && candidate.destination === base.destination) score += 25;

  if (base.activityType && candidate.activityType === base.activityType) score += 25;

  score += priceBandScore(base.priceUsd, candidate.priceUsd);
  score += formatOverlapScore(getTourFormats(base), candidate);

  const baseOwner = resolveListingOwnerUserId(base);
  const candidateOwner = resolveListingOwnerUserId(candidate);
  if (baseOwner !== candidateOwner) score += 8;

  score += Math.min(candidate.rating, 5) * 2;
  if (candidate.reviewCount >= 5) score += 3;

  return score;
}

export function rankSimilarListings(
  base: TourListing,
  candidates: TourListing[],
  limit = 3
): TourListing[] {
  return candidates
    .map((candidate) => ({
      candidate,
      score: scoreTourListingSimilarity(base, candidate),
    }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score || b.candidate.rating - a.candidate.rating)
    .slice(0, limit)
    .map((item) => item.candidate);
}

export function getRecommendedListings(
  listings: TourListing[] = getMarketplaceListings(),
  limit = 6
): TourListing[] {
  return [...listings]
    .sort((a, b) => {
      const scoreA =
        (a.isBestOfMonth ? 30 : 0) +
        (a.isHot ? 20 : 0) +
        (a.isNew ? 10 : 0) +
        a.rating * 4 +
        Math.min(a.reviewCount, 50) * 0.2;
      const scoreB =
        (b.isBestOfMonth ? 30 : 0) +
        (b.isHot ? 20 : 0) +
        (b.isNew ? 10 : 0) +
        b.rating * 4 +
        Math.min(b.reviewCount, 50) * 0.2;
      return scoreB - scoreA;
    })
    .slice(0, limit);
}

export function getSimilarTourDetails(
  currentSlug: string,
  limit = 3,
  listings: TourListing[] = getMarketplaceListings()
): TourDetail[] {
  const baseListing = listings.find((item) => item.slug === currentSlug);
  if (!baseListing) {
    return listings
      .filter((item) => item.slug !== currentSlug)
      .slice(0, limit)
      .map((item) => getTourDetail(item.slug))
      .filter((item): item is TourDetail => Boolean(item));
  }

  const ranked = rankSimilarListings(baseListing, listings, limit);
  return ranked
    .map((item) => getTourDetail(item.slug))
    .filter((item): item is TourDetail => Boolean(item));
}
