import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchTripsterGuide } from "@/lib/tripster/client";
import {
  mapTripsterGuideProfile,
  mergeGuideProfileWithListings,
} from "@/lib/tripster/guide-mapper";
import {
  fetchExcursionGuideIds,
  fetchExcursionListingsByGuideId,
} from "@/lib/tripster/repository";
import {
  pgFetchExcursionGuideIds,
  pgFetchExcursionsByGuideId,
} from "@/lib/tripster/pg-repository";
import type { ExcursionGuideProfile, ExcursionListing } from "@/types/excursion";

function getClient() {
  try {
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
}

export async function fetchGuideExcursionsServer(guideId: number): Promise<ExcursionListing[]> {
  const supabase = getClient();
  if (supabase) return fetchExcursionListingsByGuideId(supabase, guideId);
  return pgFetchExcursionsByGuideId(guideId);
}

function profileFromExcursions(
  guideId: number,
  excursions: ExcursionListing[]
): ExcursionGuideProfile | null {
  const guide = excursions.find((item) => item.guide?.id === guideId)?.guide;
  if (!guide) return null;

  return mergeGuideProfileWithListings(
    {
      id: guideId,
      name: guide.name,
      url: guide.url,
      avatar: guide.avatar,
    },
    excursions.length
  );
}

export async function fetchGuideProfileServer(
  guideId: number
): Promise<ExcursionGuideProfile | null> {
  const excursions = await fetchGuideExcursionsServer(guideId);
  if (excursions.length === 0) return null;

  try {
    const raw = await fetchTripsterGuide(guideId, { detailed: true });
    return mergeGuideProfileWithListings(mapTripsterGuideProfile(raw), excursions.length);
  } catch {
    return profileFromExcursions(guideId, excursions);
  }
}

export async function fetchGuideIdsServer(): Promise<number[]> {
  const supabase = getClient();
  if (supabase) return fetchExcursionGuideIds(supabase);
  return pgFetchExcursionGuideIds();
}

export async function fetchGuidePageServer(guideId: number): Promise<{
  profile: ExcursionGuideProfile;
  excursions: ExcursionListing[];
} | null> {
  const excursions = await fetchGuideExcursionsServer(guideId);
  if (excursions.length === 0) return null;

  const profile = await fetchGuideProfileServer(guideId);
  if (!profile) return null;

  return { profile, excursions };
}
