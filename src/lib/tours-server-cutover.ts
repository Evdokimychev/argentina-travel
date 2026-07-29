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
import {
  partnerOk,
  partnerUnavailableFromError,
  type PartnerSourceResult,
} from "@/lib/partner-source-result";

function shouldFallbackToSeedCatalog(): boolean {
  if (!isSupabaseToursEnabled()) return true;
  return getToursSourceMode() === "hybrid";
}

function reportCatalogSourceError(operation: string, error: unknown): void {
  console.error("[catalog_source_error]", {
    operation,
    message: error instanceof Error ? error.message : String(error),
  });
}

export async function fetchCutoverPublishedTourListings(): Promise<TourListing[]> {
  if (!isSupabaseToursEnabled()) {
    return fetchRepositoryMarketplaceTours();
  }

  try {
    const { fetchPublishedListingsServer } = await import("@/lib/tour-content-server");
    return await fetchPublishedListingsServer();
  } catch (error) {
    reportCatalogSourceError("published_tour_listings", error);
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
  } catch (error) {
    reportCatalogSourceError("published_tour_slugs", error);
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
  const result = await fetchCutoverTourDetailResultBySlug(slug, opts);
  if (result.status === "unavailable") {
    throw new Error(`tour_detail_${result.errorClass}: ${result.message}`);
  }
  return result.data;
}

export async function fetchCutoverTourDetailResultBySlug(
  slug: string,
  opts?: { accessToken?: string | null }
): Promise<PartnerSourceResult<TourDetail | null>> {
  let databaseUnavailable: Extract<PartnerSourceResult<never>, { status: "unavailable" }> | null = null;

  if (isSupabaseToursEnabled()) {
    try {
      const { fetchTourDetailBySlugResultServer } = await import("@/lib/tour-content-server");
      const fromDb = await fetchTourDetailBySlugResultServer(slug, opts);
      if (fromDb.status === "ok") {
        if (fromDb.data) return fromDb;
        if (shouldUseSupabaseToursAsSourceOfTruth()) return fromDb;
      } else {
        databaseUnavailable = fromDb;
        if (shouldUseSupabaseToursAsSourceOfTruth()) return fromDb;
      }
    } catch (error) {
      reportCatalogSourceError("tour_detail", error);
      const unavailable = partnerUnavailableFromError(error);
      if (unavailable.status === "unavailable") {
        databaseUnavailable = unavailable;
        if (shouldUseSupabaseToursAsSourceOfTruth()) return unavailable;
      }
    }
  }

  const fallback = getRepositoryTourDetail(slug, opts?.accessToken) ?? getLegacyTourDetail(slug) ?? null;
  if (fallback) return partnerOk(fallback);
  return databaseUnavailable ?? partnerOk(null);
}

export async function fetchCutoverCanonicalTourBySlug(slug: string): Promise<Tour | null> {
  if (isSupabaseToursEnabled()) {
    try {
      const { fetchCanonicalTourBySlugServer } = await import("@/lib/tour-content-server");
      const fromDb = await fetchCanonicalTourBySlugServer(slug);
      if (fromDb) return fromDb;
      if (shouldUseSupabaseToursAsSourceOfTruth()) return null;
    } catch (error) {
      reportCatalogSourceError("canonical_tour", error);
      if (shouldUseSupabaseToursAsSourceOfTruth()) return null;
    }
  }

  return getCanonicalTourBySlug(slug) ?? null;
}
