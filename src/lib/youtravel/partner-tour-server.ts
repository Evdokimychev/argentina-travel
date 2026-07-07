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
import type { TourDetail, TourListing } from "@/types";

function getClient() {
  try {
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
}

export async function fetchYouTravelTourListingsServer(): Promise<TourListing[]> {
  const supabase = getClient();
  if (!supabase) return [];

  try {
    return await fetchYouTravelTourListings(supabase);
  } catch {
    return [];
  }
}

const cachedYouTravelTourListings = unstable_cache(
  fetchYouTravelTourListingsServer,
  ["youtravel-tour-listings-v1"],
  { revalidate: 600, tags: ["partner-tours", "youtravel-tours"] },
);

export async function fetchYouTravelTourListingsCached(): Promise<TourListing[]> {
  return cachedYouTravelTourListings();
}

export const fetchYouTravelTourListingsCachedReact = cache(fetchYouTravelTourListingsCached);

export async function fetchYouTravelTourSlugsServer(): Promise<string[]> {
  const supabase = getClient();
  if (!supabase) return [];

  try {
    return await fetchYouTravelTourSlugs(supabase);
  } catch {
    return [];
  }
}

export async function fetchYouTravelTourDetailServer(slug: string): Promise<TourDetail | null> {
  const supabase = getClient();
  if (!supabase) return null;

  try {
    const detail = await fetchYouTravelTourDetail(supabase, slug);
    if (!detail) return null;
    return enrichYouTravelTourDetailOffers(detail);
  } catch {
    return null;
  }
}

export const fetchYouTravelTourDetailCached = cache(fetchYouTravelTourDetailServer);
