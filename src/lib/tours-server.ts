import type { TourDetail, TourListing, TourReview } from "@/types";
import { getSimilarTourDetails, rankSimilarListings } from "@/lib/tour-recommendations";
import { getSimilarTours } from "@/lib/tours";
import { fetchTourPublicReviews } from "@/lib/reviews-server";
import {
  deriveTourReviewStats,
  stripStaticSeedReviews,
} from "@/lib/tour-review-stats";
import { isPartnerTourListing } from "@/lib/tripster/partner-tour-utils";
import {
  fetchPartnerTourDetailServer,
} from "@/lib/tripster/partner-tour-server";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { fetchCutoverTourDetailBySlug } from "@/lib/tours-server-cutover";

function resolveReviewSortTimestamp(review: TourReview): number {
  const value = review.date || review.tripDate;
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function mergeTourReviews(base: TourReview[], fromDatabase: TourReview[]): TourReview[] {
  if (!fromDatabase.length) return base;
  const deduped = new Map<string, TourReview>();

  for (const review of [...fromDatabase, ...base]) {
    const rawId = review.id.trim();
    const fallbackId = `${review.author}|${review.text}|${review.date}|${review.tripDate}`;
    const key = rawId || fallbackId;
    if (!deduped.has(key)) {
      deduped.set(key, review);
    }
  }

  return [...deduped.values()].sort(
    (a, b) => resolveReviewSortTimestamp(b) - resolveReviewSortTimestamp(a)
  );
}

function applyPublicReviewsToDetail(tour: TourDetail, publicReviews: TourReview[]): TourDetail {
  const baseReviews = stripStaticSeedReviews(tour.reviews);
  const mergedReviews = publicReviews.length
    ? mergeTourReviews(baseReviews, publicReviews)
    : baseReviews;
  const stats = deriveTourReviewStats(mergedReviews);

  return {
    ...tour,
    reviews: mergedReviews,
    reviewCount: stats.reviewCount,
    rating: stats.rating,
  };
}

async function enrichTourWithPublicReviews(tour: TourDetail | null): Promise<TourDetail | null> {
  if (!tour) return null;

  try {
    const publicReviews = await fetchTourPublicReviews(tour.slug);
    return applyPublicReviewsToDetail(tour, publicReviews);
  } catch {
    return tour;
  }
}

async function fetchNativeTourDetail(
  slug: string,
  opts?: { accessToken?: string | null }
): Promise<TourDetail | null> {
  return fetchCutoverTourDetailBySlug(slug, opts);
}

export async function fetchTourDetail(
  slug: string,
  opts?: { accessToken?: string | null }
): Promise<TourDetail | null> {
  const native = await fetchNativeTourDetail(slug, opts);
  if (native) return enrichTourWithPublicReviews(native);
  const partner = await fetchPartnerTourDetailServer(slug);
  return enrichTourWithPublicReviews(partner);
}

/**
 * Minimal shape the "similar tours" card actually renders. Decoupled from both
 * TourListing and TourDetail so the section can be built from cheap listing data
 * instead of triggering a full (live, partner-API) detail enrichment per card.
 */
export type SimilarTourCard = Pick<
  TourListing,
  | "slug"
  | "title"
  | "image"
  | "region"
  | "shortDescription"
  | "durationDays"
  | "durationNights"
  | "priceUsd"
  | "originalPriceUsd"
  | "priceOnRequest"
  | "priceFromPrefix"
>;

function toSimilarCard(item: TourListing | TourDetail): SimilarTourCard {
  return {
    slug: item.slug,
    title: item.title,
    image: item.image,
    region: item.region,
    shortDescription: item.shortDescription,
    durationDays: item.durationDays,
    durationNights: item.durationNights,
    priceUsd: item.priceUsd,
    originalPriceUsd: item.originalPriceUsd,
    priceOnRequest: item.priceOnRequest,
    priceFromPrefix: item.priceFromPrefix,
  };
}

export async function fetchSimilarTours(slug: string, limit = 3): Promise<SimilarTourCard[]> {
  const listings = await fetchMarketplaceTours();
  if (listings.length === 0) {
    return getSimilarTours(slug, limit).map(toSimilarCard);
  }

  const baseListing = listings.find((item) => item.slug === slug);
  if (!baseListing) {
    const partnerOnly = listings.filter((item) => isPartnerTourListing(item));
    if (partnerOnly.length === 0) {
      return getSimilarTourDetails(slug, limit, listings).map(toSimilarCard);
    }
    return [];
  }

  // Listing-level data is sufficient for the card — no per-card detail fetch.
  return rankSimilarListings(baseListing, listings, limit).map(toSimilarCard);
}
