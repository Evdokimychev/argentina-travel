import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { TourListing } from "@/types";
import { mergeMarketplaceTourListings } from "@/lib/tripster/partner-tour-utils";

/** Каталог меняется редко; 5 мин — баланс свежести и TTFB для роботов и cold start. */
export const MARKETPLACE_CATALOG_REVALIDATE_SEC = 300;
export const MARKETPLACE_CATALOG_DEADLINE_MS = 2_500;

let lastSuccessfulMarketplaceTours: TourListing[] | null = null;
let marketplaceToursInFlight: Promise<TourListing[]> | null = null;

function reportMarketplaceSourceError(source: string, error: unknown): void {
  console.error("[marketplace_source_error]", {
    source,
    message: error instanceof Error ? error.message : String(error),
  });
}

async function loadPlatformTourListingsForCatalog(): Promise<TourListing[]> {
  const { isSupabaseToursEnabled, getToursSourceMode } = await import("@/lib/auth-mode");
  const { fetchRepositoryMarketplaceTours } = await import("@/lib/tour-repository");
  const { isProductionRuntime } = await import("@/lib/runtime-mode");

  if (!isSupabaseToursEnabled()) {
    return isProductionRuntime() ? [] : fetchRepositoryMarketplaceTours();
  }

  try {
    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    const { fetchPublishedListingsResult } = await import("@/lib/tour-content-server");
    const supabase = createSupabaseAdminClient();
    const result = await fetchPublishedListingsResult(supabase);
    if (result.status === "unavailable") {
      throw new Error(`platform_tours_${result.errorClass}: ${result.message}`);
    }
    if (result.data.length) return result.data;
  } catch (error) {
    reportMarketplaceSourceError("platform_tours", error);
    if (getToursSourceMode() !== "hybrid" || isProductionRuntime()) {
      throw error;
    }
  }

  if (getToursSourceMode() === "hybrid" && !isProductionRuntime()) {
    return fetchRepositoryMarketplaceTours();
  }
  return [];
}

async function fetchPartnerTourListingsSafe(): Promise<TourListing[]> {
  try {
    const { fetchPartnerTourListingsServer } = await import(
      "@/lib/tripster/partner-tour-server"
    );
    return await fetchPartnerTourListingsServer();
  } catch (error) {
    reportMarketplaceSourceError("tripster", error);
    if (lastSuccessfulMarketplaceTours) {
      return lastSuccessfulMarketplaceTours.filter((tour) => tour.partnerSource === "tripster");
    }
    throw error;
  }
}

async function fetchYouTravelTourListingsSafe(): Promise<TourListing[]> {
  try {
    const { fetchYouTravelTourListingsCached } = await import(
      "@/lib/youtravel/partner-tour-server"
    );
    return await fetchYouTravelTourListingsCached();
  } catch (error) {
    reportMarketplaceSourceError("youtravel", error);
    if (lastSuccessfulMarketplaceTours) {
      return lastSuccessfulMarketplaceTours.filter((tour) => tour.partnerSource === "youtravel");
    }
    throw error;
  }
}

/** Без cookies/headers — безопасно для `unstable_cache`. */
async function loadMarketplaceToursUncached(): Promise<TourListing[]> {
  const results = await Promise.allSettled([
    loadPlatformTourListingsForCatalog(),
    fetchPartnerTourListingsSafe(),
    fetchYouTravelTourListingsSafe(),
  ]);

  const platform = results[0].status === "fulfilled" ? results[0].value : [];
  const tripster = results[1].status === "fulfilled" ? results[1].value : [];
  const youtravel = results[2].status === "fulfilled" ? results[2].value : [];

  const sourceFailures = results.filter((result) => result.status === "rejected");
  for (const failure of sourceFailures) {
    if (failure.status === "rejected") {
      reportMarketplaceSourceError("catalog_source", failure.reason);
    }
  }

  return resolveMarketplaceSourceResults(
    platform,
    tripster,
    youtravel,
    sourceFailures.length,
    lastSuccessfulMarketplaceTours,
  );
}

export function resolveMarketplaceSourceResults(
  platform: TourListing[],
  tripster: TourListing[],
  youtravel: TourListing[],
  failedSourceCount: number,
  lastKnownGood: TourListing[] | null,
): TourListing[] {
  const merged = mergeMarketplaceTourListings(platform, tripster, youtravel);
  if (merged.length > 0 || failedSourceCount === 0) return merged;

  // Не превращаем временный сбой хотя бы одного источника в «успешный» пустой
  // каталог: иначе unstable_cache запомнит деградацию на весь TTL.
  if (lastKnownGood?.length) return lastKnownGood;
  throw new Error("marketplace_catalog_sources_unavailable");
}

const cachedMarketplaceTours = unstable_cache(
  loadMarketplaceToursUncached,
  ["marketplace-tours-catalog-v2"],
  {
    revalidate: MARKETPLACE_CATALOG_REVALIDATE_SEC,
    tags: ["marketplace-catalog"],
  },
);

export async function resolveMarketplaceCatalogWithinDeadline(
  catalogPromise: Promise<TourListing[]>,
  fallback: () => TourListing[],
  deadlineMs = MARKETPLACE_CATALOG_DEADLINE_MS,
): Promise<TourListing[]> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<TourListing[]>((resolve, reject) => {
    timeout = setTimeout(() => {
      try {
        resolve(fallback());
      } catch (error) {
        reject(error);
      }
    }, deadlineMs);
  });

  try {
    return await Promise.race([catalogPromise, deadline]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function loadMarketplaceToursInBackground(): Promise<TourListing[]> {
  if (marketplaceToursInFlight) return marketplaceToursInFlight;

  marketplaceToursInFlight = cachedMarketplaceTours()
    .then((tours) => {
      if (tours.length > 0) lastSuccessfulMarketplaceTours = tours;
      return tours;
    })
    .finally(() => {
      marketplaceToursInFlight = null;
    });

  return marketplaceToursInFlight;
}

/** Cross-request catalog cache + dedupe внутри одного RSC-запроса. */
export const fetchMarketplaceTours = cache(async (): Promise<TourListing[]> => {
  const catalogPromise = loadMarketplaceToursInBackground();
  const tours = await resolveMarketplaceCatalogWithinDeadline(
    catalogPromise,
    () => {
      if (lastSuccessfulMarketplaceTours) return lastSuccessfulMarketplaceTours;
      throw new Error("marketplace_catalog_deadline_exceeded_without_lkg");
    },
  );

  // Observe a late rejection after the response deadline so it cannot become an
  // unhandled promise rejection. The next request still retries the source.
  void catalogPromise.catch((error) => reportMarketplaceSourceError("catalog", error));
  return tours;
});
