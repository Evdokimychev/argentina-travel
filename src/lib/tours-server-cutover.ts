import type { TourDetail, TourListing } from "@/types";
import type { Tour } from "@/types/tour";
import {
  getToursSourceMode,
  isSupabaseToursEnabled,
  shouldUseSupabaseToursAsSourceOfTruth,
} from "@/lib/auth-mode";
import {
  fetchRepositoryMarketplaceTours,
  getCanonicalTourBySlug,
  getMarketplaceListings,
  getRepositoryTourDetail,
} from "@/lib/tour-repository";
import { getLegacyTourDetail } from "@/lib/tours-legacy";

function shouldFallbackToSeedCatalog(): boolean {
  if (!isSupabaseToursEnabled()) return true;
  return getToursSourceMode() === "hybrid";
}

export async function fetchCutoverPublishedTourListings(): Promise<TourListing[]> {
  if (!isSupabaseToursEnabled()) {
    return fetchRepositoryMarketplaceTours();
  }

  try {
    const { fetchPublishedListingsServer } = await import("@/lib/tour-content-server");
    return await fetchPublishedListingsServer();
  } catch {
    if (shouldFallbackToSeedCatalog()) {
      return fetchRepositoryMarketplaceTours();
    }
    return [];
  }
}

export async function fetchCutoverPublishedTourSlugs(): Promise<string[]> {
  if (!isSupabaseToursEnabled()) {
    return getMarketplaceListings().map((tour) => tour.slug);
  }

  try {
    const { fetchPublishedSlugsServer } = await import("@/lib/tour-content-server");
    const slugs = await fetchPublishedSlugsServer();
    if (shouldUseSupabaseToursAsSourceOfTruth()) {
      return slugs;
    }

    const local = getMarketplaceListings().map((tour) => tour.slug);
    return [...new Set([...slugs, ...local])];
  } catch {
    if (shouldFallbackToSeedCatalog()) {
      return getMarketplaceListings().map((tour) => tour.slug);
    }
    return [];
  }
}

export async function fetchCutoverTourDetailBySlug(
  slug: string,
  opts?: { accessToken?: string | null }
): Promise<TourDetail | null> {
  if (isSupabaseToursEnabled()) {
    try {
      const { fetchTourDetailBySlugServer } = await import("@/lib/tour-content-server");
      const fromDb = await fetchTourDetailBySlugServer(slug);
      if (fromDb) return fromDb;
      if (shouldUseSupabaseToursAsSourceOfTruth()) return null;
    } catch {
      if (shouldUseSupabaseToursAsSourceOfTruth()) return null;
    }
  }

  return getRepositoryTourDetail(slug, opts?.accessToken) ?? getLegacyTourDetail(slug) ?? null;
}

export async function fetchCutoverCanonicalTourBySlug(slug: string): Promise<Tour | null> {
  if (isSupabaseToursEnabled()) {
    try {
      const { fetchCanonicalTourBySlugServer } = await import("@/lib/tour-content-server");
      const fromDb = await fetchCanonicalTourBySlugServer(slug);
      if (fromDb) return fromDb;
      if (shouldUseSupabaseToursAsSourceOfTruth()) return null;
    } catch {
      if (shouldUseSupabaseToursAsSourceOfTruth()) return null;
    }
  }

  return getCanonicalTourBySlug(slug) ?? null;
}
