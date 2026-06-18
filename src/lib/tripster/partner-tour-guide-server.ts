import "server-only";

import pg from "pg";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchTripsterGuide, isTripsterConfigured } from "@/lib/tripster/client";
import {
  mapTripsterGuideProfile,
  mergeGuideProfileWithListings,
  resolveTripsterGuideRoleLabel,
} from "@/lib/tripster/guide-mapper";
import { mapPartnerTourReviews } from "@/lib/tripster/partner-tour-mapper";
import { tripsterReviewToRow, type TripsterReviewRow } from "@/lib/tripster/review-mapper";
import type { ExcursionGuideProfile } from "@/types/excursion";
import type { TourOrganizerDetail } from "@/types";

function getDatabaseUrl(): string | null {
  return process.env.DATABASE_URL?.trim() ?? null;
}

async function withPgClient<T>(fn: (client: pg.Client) => Promise<T>): Promise<T | null> {
  const connectionString = getDatabaseUrl();
  if (!connectionString) return null;

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    return await fn(client);
  } catch {
    return null;
  } finally {
    await client.end().catch(() => undefined);
  }
}

function getClient() {
  try {
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
}

async function pgFetchGuideExperienceCount(guideId: number): Promise<number> {
  const result = await withPgClient(async (client) => {
    const { rows } = await client.query(
      `select count(*)::int as count
       from public.tripster_experiences
       where (payload->'guide'->>'id')::int = $1
         and (experience_type = 'tour' or payload->>'type' = 'tour')`,
      [guideId]
    );
    return (rows[0]?.count as number | undefined) ?? 0;
  });
  return result ?? 0;
}

async function supabaseFetchGuideExperienceCount(guideId: number): Promise<number> {
  const supabase = getClient();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("tripster_experiences")
    .select("id", { count: "exact", head: true })
    .filter("payload->guide->>id", "eq", String(guideId))
    .or("experience_type.eq.tour,payload->>type.eq.tour");

  if (error || count == null) return 0;
  return count;
}

export async function fetchGuideExperienceCountServer(guideId: number): Promise<number> {
  const supabaseCount = await supabaseFetchGuideExperienceCount(guideId);
  if (supabaseCount > 0) return supabaseCount;
  return pgFetchGuideExperienceCount(guideId);
}

async function pgFetchGuideReviewRows(
  guideId: number,
  excludeExperienceId?: number,
  limit = 50
): Promise<TripsterReviewRow[]> {
  const result = await withPgClient(async (client) => {
    const { rows } = await client.query(
      `select r.id, r.rating, r.author_name, r.review_text, r.created_at, r.payload
       from public.tripster_reviews r
       inner join public.tripster_experiences e on e.id = r.experience_id
       where (e.payload->'guide'->>'id')::int = $1
         and ($2::int is null or e.id <> $2)
       order by r.created_at desc nulls last
       limit $3`,
      [guideId, excludeExperienceId ?? null, limit]
    );
    return rows as TripsterReviewRow[];
  });
  return result ?? [];
}

async function supabaseFetchGuideReviewRows(
  guideId: number,
  excludeExperienceId?: number,
  limit = 50
): Promise<TripsterReviewRow[]> {
  const supabase = getClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("tripster_experiences")
    .select("id")
    .filter("payload->guide->>id", "eq", String(guideId));

  if (error || !data?.length) return [];

  const experienceIds = data
    .map((row) => row.id as number)
    .filter((id) => !excludeExperienceId || id !== excludeExperienceId);

  if (experienceIds.length === 0) return [];

  const { data: reviews, error: reviewsError } = await supabase
    .from("tripster_reviews")
    .select("id, rating, author_name, review_text, created_at, payload")
    .in("experience_id", experienceIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (reviewsError || !reviews) return [];
  return reviews as TripsterReviewRow[];
}

export async function fetchGuideReviewRowsServer(
  guideId: number,
  options?: { excludeExperienceId?: number; limit?: number }
): Promise<TripsterReviewRow[]> {
  const limit = options?.limit ?? 50;
  const fromSupabase = await supabaseFetchGuideReviewRows(
    guideId,
    options?.excludeExperienceId,
    limit
  );
  if (fromSupabase.length > 0) return fromSupabase;
  return pgFetchGuideReviewRows(guideId, options?.excludeExperienceId, limit);
}

export async function fetchPartnerTourGuideProfileServer(
  guideId: number
): Promise<{ profile: ExcursionGuideProfile; experienceCount: number } | null> {
  if (!Number.isFinite(guideId) || guideId <= 0) return null;

  const experienceCount = await fetchGuideExperienceCountServer(guideId);

  try {
    const raw = await fetchTripsterGuide(guideId, { detailed: true });
    const profile = mergeGuideProfileWithListings(
      mapTripsterGuideProfile(raw),
      Math.max(experienceCount, 1)
    );
    return {
      profile: {
        ...profile,
        excursionCount: Math.max(experienceCount, profile.excursionCount ?? 0),
      },
      experienceCount: Math.max(experienceCount, profile.excursionCount ?? 0),
    };
  } catch {
    return null;
  }
}

export function applyTripsterGuideToOrganizer(
  organizer: TourOrganizerDetail,
  profile: ExcursionGuideProfile,
  experienceCount: number
): TourOrganizerDetail {
  const reviewCount = profile.reviewCount ?? organizer.reviewCount ?? 0;
  const rating = profile.rating ?? organizer.rating;
  const role =
    profile.roleLabel ??
    resolveTripsterGuideRoleLabel(profile.guideType, profile.isLicensed);

  return {
    ...organizer,
    id: String(profile.id),
    name: profile.name || organizer.name,
    avatar: profile.avatar || organizer.avatar,
    role,
    shortDescription: profile.tagline?.trim() || organizer.shortDescription,
    extendedDescription: profile.description?.trim() || organizer.extendedDescription,
    rating,
    reviewCount,
    tourCount: Math.max(experienceCount, organizer.tourCount),
    travelerCount: profile.visitorCount ?? organizer.travelerCount,
    platformRegisteredAt: profile.guideSince?.trim() || organizer.platformRegisteredAt,
    experienceYears: 0,
    languages: organizer.languages.length > 0 ? organizer.languages : ["Русский"],
    slug: organizer.slug ?? `tripster-guide-${profile.id}`,
  };
}
