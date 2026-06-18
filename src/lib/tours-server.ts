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

async function resolveSimilarTourDetail(
  listing: TourListing,
  opts?: { accessToken?: string | null }
): Promise<TourDetail | null> {
  if (isPartnerTourListing(listing)) {
    return fetchPartnerTourDetailServer(listing.slug);
  }
  return fetchNativeTourDetail(listing.slug, opts);
}

export async function fetchSimilarTours(slug: string, limit = 3): Promise<TourDetail[]> {
  const listings = await fetchMarketplaceTours();
  if (listings.length === 0) {
    return getSimilarTours(slug, limit);
  }

  const baseListing = listings.find((item) => item.slug === slug);
  if (!baseListing) {
    const partnerOnly = listings.filter((item) => isPartnerTourListing(item));
    if (partnerOnly.length === 0) {
      return getSimilarTourDetails(slug, limit, listings);
    }
    return [];
  }

  const ranked = rankSimilarListings(baseListing, listings, limit);
  const details: TourDetail[] = [];
  for (const item of ranked) {
    const detail = await resolveSimilarTourDetail(item);
    if (detail) details.push(detail);
  }
  return details;
}
