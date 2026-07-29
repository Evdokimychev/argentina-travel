import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { enrichYouTravelTourDetailOffers } from "@/lib/youtravel/offers-server";
import {
  fetchYouTravelTourDetail,
  fetchYouTravelTourListings,
  fetchYouTravelTourSlugs,
} from "@/lib/youtravel/partner-tour-repository";
import {
  logPartnerSourceUnavailable,
  partnerOk,
  partnerUnavailableFromError,
  type PartnerSourceResult,
} from "@/lib/partner-source-result";
import type { TourDetail, TourListing } from "@/types";
import {
  shouldLogCatalogRestError,
  withCatalogRestCircuit,
} from "@/lib/catalog-rest-circuit";

function getClient() {
  try {
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
}

export async function fetchYouTravelTourListingsResultServer(): Promise<
  PartnerSourceResult<TourListing[]>
> {
  const supabase = getClient();
  let supabaseError: unknown = null;

  if (supabase) {
    try {
      const listings = await withCatalogRestCircuit(() =>
        fetchYouTravelTourListings(supabase),
      );
      if (listings.length > 0) return partnerOk(listings);
    } catch (error) {
      supabaseError = error;
      if (shouldLogCatalogRestError(error)) {
        logPartnerSourceUnavailable(
          "youtravel_listings_supabase",
          partnerUnavailableFromError(error) as Extract<
            PartnerSourceResult<never>,
            { status: "unavailable" }
          >,
        );
      }
    }
  } else {
    supabaseError = new Error("supabase_admin_client_unavailable");
  }

  try {
    const { pgFetchYouTravelTourListings } = await import(
      "@/lib/youtravel/partner-tour-pg-repository"
    );
    return partnerOk(await pgFetchYouTravelTourListings());
  } catch (error) {
    return partnerUnavailableFromError(supabaseError ?? error);
  }
}

export async function fetchYouTravelTourListingsServer(): Promise<TourListing[]> {
  const result = await fetchYouTravelTourListingsResultServer();
  if (result.status === "ok") return result.data;
  if (shouldLogCatalogRestError(result.message)) {
    logPartnerSourceUnavailable("youtravel_listings", result);
  }
  throw new Error(`youtravel_listings_unavailable:${result.errorClass}: ${result.message}`);
}

const cachedYouTravelTourListings = unstable_cache(
  fetchYouTravelTourListingsServer,
  ["youtravel-tour-listings-v3"],
  { revalidate: 600, tags: ["partner-tours", "youtravel-tours"] },
);

export async function fetchYouTravelTourListingsCached(): Promise<TourListing[]> {
  return cachedYouTravelTourListings();
}

export const fetchYouTravelTourListingsCachedReact = cache(fetchYouTravelTourListingsCached);

export async function fetchYouTravelTourSlugsResultServer(): Promise<
  PartnerSourceResult<string[]>
> {
  const supabase = getClient();
  let supabaseError: unknown = null;

  if (supabase) {
    try {
      const slugs = await withCatalogRestCircuit(() =>
        fetchYouTravelTourSlugs(supabase),
      );
      if (slugs.length > 0) return partnerOk(slugs);
    } catch (error) {
      supabaseError = error;
      if (shouldLogCatalogRestError(error)) {
        logPartnerSourceUnavailable(
          "youtravel_slugs_supabase",
          partnerUnavailableFromError(error) as Extract<
            PartnerSourceResult<never>,
            { status: "unavailable" }
          >,
        );
      }
    }
  } else {
    supabaseError = new Error("supabase_admin_client_unavailable");
  }

  try {
    const { pgFetchYouTravelTourSlugs } = await import(
      "@/lib/youtravel/partner-tour-pg-repository"
    );
    return partnerOk(await pgFetchYouTravelTourSlugs());
  } catch (error) {
    return partnerUnavailableFromError(supabaseError ?? error);
  }
}

export async function fetchYouTravelTourSlugsServer(): Promise<string[]> {
  const result = await fetchYouTravelTourSlugsResultServer();
  if (result.status === "ok") return result.data;
  if (shouldLogCatalogRestError(result.message)) {
    logPartnerSourceUnavailable("youtravel_slugs", result);
  }
  throw new Error(`youtravel_slugs_unavailable:${result.errorClass}: ${result.message}`);
}

async function loadYouTravelTourDetailResult(
  slug: string,
): Promise<PartnerSourceResult<TourDetail | null>> {
  const supabase = getClient();
  let supabaseError: unknown = null;

  if (supabase) {
    try {
      const detail = await withCatalogRestCircuit(() =>
        fetchYouTravelTourDetail(supabase, slug),
      );
      if (detail) {
        return partnerOk(await enrichYouTravelTourDetailOffers(detail));
      }
    } catch (error) {
      supabaseError = error;
      if (shouldLogCatalogRestError(error)) {
        logPartnerSourceUnavailable(
          "youtravel_detail_supabase",
          partnerUnavailableFromError(error) as Extract<
            PartnerSourceResult<never>,
            { status: "unavailable" }
          >,
        );
      }
    }
  } else {
    supabaseError = new Error("supabase_admin_client_unavailable");
  }

  try {
    const { pgFetchYouTravelTourDetail } = await import(
      "@/lib/youtravel/partner-tour-pg-repository"
    );
    const detail = await pgFetchYouTravelTourDetail(slug);
    if (!detail) {
      if (supabaseError) return partnerUnavailableFromError(supabaseError);
      return partnerOk(null);
    }
    return partnerOk(await enrichYouTravelTourDetailOffers(detail));
  } catch (error) {
    return partnerUnavailableFromError(supabaseError ?? error);
  }
}

export async function fetchYouTravelTourDetailResultServer(
  slug: string,
): Promise<PartnerSourceResult<TourDetail | null>> {
  return loadYouTravelTourDetailResult(slug);
}

export async function fetchYouTravelTourDetailServer(slug: string): Promise<TourDetail | null> {
  const result = await loadYouTravelTourDetailResult(slug);
  if (result.status === "ok") return result.data;
  if (shouldLogCatalogRestError(result.message)) {
    logPartnerSourceUnavailable("youtravel_detail", result);
  }
  throw new Error(`youtravel_detail_unavailable:${result.errorClass}: ${result.message}`);
}

export const fetchYouTravelTourDetailCached = cache(fetchYouTravelTourDetailServer);
