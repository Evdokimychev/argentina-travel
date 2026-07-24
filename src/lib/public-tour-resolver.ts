import "server-only";

import type { TourDetail, TourListing } from "@/types";
import { fetchCutoverTourDetailBySlug } from "@/lib/tours-server-cutover";
import {
  fetchPartnerTourDetailResultServer,
} from "@/lib/tripster/partner-tour-server";
import {
  fetchYouTravelTourDetailResultServer,
} from "@/lib/youtravel/partner-tour-server";
import { isYouTravelTourSlug } from "@/lib/youtravel/partner-tour-mapper";
import { fetchTourPublicReviews } from "@/lib/reviews-server";
import {
  deriveTourReviewStats,
  stripStaticSeedReviews,
} from "@/lib/tour-review-stats";
import type { TourReview } from "@/types";
import {
  classifyPartnerError,
  logPartnerSourceUnavailable,
  type PartnerSourceErrorClass,
} from "@/lib/partner-source-result";
import { isDefaultCatalogTour } from "@/lib/catalog-country-relevance";

export type PublicTourResolution =
  | {
      status: "resolved";
      source: "platform" | "tripster" | "youtravel";
      tour: TourDetail;
      snapshotId: string;
      resolvedAt: string;
    }
  | { status: "retired"; redirectTo?: string; reason: string }
  | { status: "missing"; reason: "confirmed_absent" }
  | {
      status: "unavailable";
      source?: string;
      retryable: true;
      errorClass: PartnerSourceErrorClass;
    };

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
    (a, b) => resolveReviewSortTimestamp(b) - resolveReviewSortTimestamp(a),
  );
}

async function enrichTourWithPublicReviews(tour: TourDetail): Promise<TourDetail> {
  try {
    const publicReviews = await fetchTourPublicReviews(tour.slug);
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
  } catch {
    return tour;
  }
}

function resolved(
  source: "platform" | "tripster" | "youtravel",
  tour: TourDetail,
): PublicTourResolution {
  return {
    status: "resolved",
    source,
    tour,
    snapshotId: `${source}:${tour.slug}`,
    resolvedAt: new Date().toISOString(),
  };
}

/**
 * Canonical public tour resolver. Callers must map:
 * resolved → detail, missing → 404, unavailable → 503/degraded (never 404).
 */
export async function resolvePublicTourBySlug(
  slug: string,
  opts?: { accessToken?: string | null },
): Promise<PublicTourResolution> {
  const unavailable: Array<Extract<PublicTourResolution, { status: "unavailable" }>> = [];

  try {
    const native = await fetchCutoverTourDetailBySlug(slug, opts);
    if (native) {
      return resolved("platform", await enrichTourWithPublicReviews(native));
    }
  } catch (error) {
    unavailable.push({
      status: "unavailable",
      source: "platform",
      retryable: true,
      errorClass: classifyPartnerError(error),
    });
  }

  if (isYouTravelTourSlug(slug)) {
    const youtravel = await fetchYouTravelTourDetailResultServer(slug);
    if (youtravel.status === "ok") {
      if (youtravel.data) {
        return resolved("youtravel", await enrichTourWithPublicReviews(youtravel.data));
      }
    } else {
      logPartnerSourceUnavailable("youtravel_resolve", youtravel);
      unavailable.push({
        status: "unavailable",
        source: "youtravel",
        retryable: true,
        errorClass: youtravel.errorClass,
      });
    }
  }

  const tripster = await fetchPartnerTourDetailResultServer(slug);
  if (tripster.status === "ok") {
    if (tripster.data) {
      return resolved("tripster", await enrichTourWithPublicReviews(tripster.data));
    }
  } else {
    logPartnerSourceUnavailable("tripster_resolve", tripster);
    unavailable.push({
      status: "unavailable",
      source: "tripster",
      retryable: true,
      errorClass: tripster.errorClass,
    });
  }

  if (unavailable.length > 0) {
    return unavailable[0]!;
  }

  return { status: "missing", reason: "confirmed_absent" };
}

/**
 * Keep only catalog-relevant listings whose detail resolver returns `resolved`.
 * Use for blog/guide embeds and recommendations — never link a card to a false 404.
 */
export async function filterToursWithResolvedPublicDetail(
  tours: TourListing[],
): Promise<TourListing[]> {
  const candidates = tours.filter(isDefaultCatalogTour);
  const settled = await Promise.all(
    candidates.map(async (tour) => {
      const resolution = await resolvePublicTourBySlug(tour.slug);
      return resolution.status === "resolved" ? tour : null;
    }),
  );
  return settled.filter((tour): tour is TourListing => Boolean(tour));
}
