import type { TourDetail, TourListing } from "@/types";
import { getSimilarTourDetails, rankSimilarListings } from "@/lib/tour-recommendations";
import { getSimilarTours } from "@/lib/tours";
import { isPartnerTourListing } from "@/lib/tripster/partner-tour-utils";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { resolvePublicTourBySlug } from "@/lib/public-tour-resolver";

export async function fetchTourDetail(
  slug: string,
  opts?: { accessToken?: string | null }
): Promise<TourDetail | null> {
  const resolution = await resolvePublicTourBySlug(slug, opts);
  switch (resolution.status) {
    case "resolved":
      return resolution.tour;
    case "missing":
    case "retired":
      return null;
    case "unavailable":
      throw new Error(`tour_unavailable:${resolution.errorClass}:${resolution.source ?? "unknown"}`);
    default: {
      const _exhaustive: never = resolution;
      return _exhaustive;
    }
  }
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
