import type { TourDetail, TourListing } from "@/types";
import { isSupabaseToursEnabled } from "@/lib/auth-mode";
import { getSimilarTourDetails, rankSimilarListings } from "@/lib/tour-recommendations";
import { getTourDetail, getSimilarTours } from "@/lib/tours";
import { isPartnerTourListing } from "@/lib/tripster/partner-tour-utils";
import {
  fetchPartnerTourDetailServer,
} from "@/lib/tripster/partner-tour-server";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";

async function fetchNativeTourDetail(
  slug: string,
  opts?: { accessToken?: string | null }
): Promise<TourDetail | null> {
  if (isSupabaseToursEnabled()) {
    try {
      const { fetchTourDetailBySlugServer } = await import("@/lib/tour-content-server");
      const fromDb = await fetchTourDetailBySlugServer(slug);
      if (fromDb) return fromDb;
    } catch {
      // fallback to local repository
    }
  }
  return getTourDetail(slug, opts?.accessToken) ?? null;
}

export async function fetchTourDetail(
  slug: string,
  opts?: { accessToken?: string | null }
): Promise<TourDetail | null> {
  const native = await fetchNativeTourDetail(slug, opts);
  if (native) return native;
  return fetchPartnerTourDetailServer(slug);
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
