import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Testimonial } from "@/types";
import { getAllCanonicalTours } from "@/lib/tour-repository";
import type { TourReview } from "@/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseReviewsEnabled } from "@/lib/auth-mode";
import { stripStaticSeedReviews } from "@/lib/tour-review-stats";

function reviewToTestimonial(
  review: TourReview,
  tourSlug: string,
  tourTitle: string,
  region: string
): Testimonial {
  return {
    id: `${tourSlug}-${review.id}`,
    name: review.author,
    location: region,
    text: review.text,
    rating: review.rating,
    tourSlug,
    tourTitle,
    verifiedTrip: review.verifiedTrip === true,
  };
}

/** Fallback: top verified reviews from static tour seed data. */
export function collectTopVerifiedReviewsFromSeed(limit = 3): Testimonial[] {
  const collected: Testimonial[] = [];

  for (const tour of getAllCanonicalTours()) {
    if (tour.status !== "published") continue;

    for (const review of stripStaticSeedReviews(tour.social.reviews)) {
      if (review.verifiedTrip !== true) continue;
      collected.push(
        reviewToTestimonial(review, tour.slug, tour.title, tour.geography.region)
      );
    }
  }

  return collected
    .sort((a, b) => b.rating - a.rating || b.text.length - a.text.length)
    .slice(0, limit);
}

/** @deprecated Use collectTopVerifiedReviewsAsync in server components. */
export function collectTopVerifiedReviews(limit = 3): Testimonial[] {
  return collectTopVerifiedReviewsFromSeed(limit);
}

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "first_name" | "last_name"
>;

function resolveAuthorName(profile?: ProfileRow | null): string {
  if (!profile) return "Путешественник";
  const fullName = [profile.first_name, profile.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || profile.first_name?.trim() || "Путешественник";
}

type DbClient = SupabaseClient<Database>;

export async function fetchTopVerifiedReviewsFromDb(
  supabase: DbClient,
  limit = 3
): Promise<Testimonial[]> {
  const { data: rows, error } = await supabase
    .from("tourist_reviews")
    .select("id, user_id, tour_slug, tour_title, rating, review_text, booking_id, status, created_at")
    .eq("status", "published")
    .order("rating", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(Math.max(limit * 3, limit));

  if (error || !rows?.length) return [];

  const userIds = [
    ...new Set(rows.map((row) => row.user_id).filter((id): id is string => Boolean(id))),
  ];

  const profilesById = new Map<string, ProfileRow>();
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", userIds);

    for (const profile of profiles ?? []) {
      profilesById.set(profile.id, profile as ProfileRow);
    }
  }

  const regionBySlug = new Map(
    getAllCanonicalTours().map((tour) => [tour.slug, tour.geography.region])
  );

  return rows
    .filter((row) => row.review_text.trim().length > 0)
    .slice(0, limit)
    .map((row) => ({
      id: row.id,
      name: resolveAuthorName(row.user_id ? profilesById.get(row.user_id) : null),
      location: regionBySlug.get(row.tour_slug) ?? "Аргентина",
      text: row.review_text.trim(),
      rating: row.rating,
      tourSlug: row.tour_slug,
      tourTitle: row.tour_title,
      verifiedTrip: Boolean(row.booking_id),
    }));
}

/** Top verified reviews for homepage — Supabase first, static seed fallback. */
export async function collectTopVerifiedReviewsAsync(limit = 3): Promise<Testimonial[]> {
  if (isSupabaseReviewsEnabled()) {
    try {
      const supabase = createSupabaseAdminClient();
      const fromDb = await fetchTopVerifiedReviewsFromDb(supabase, limit);
      if (fromDb.length) return fromDb;
    } catch {
      // fallback below
    }
  }

  return collectTopVerifiedReviewsFromSeed(limit);
}

export async function hasVerifiedReviewsForHomepageAsync(): Promise<boolean> {
  const sample = await collectTopVerifiedReviewsAsync(1);
  return sample.length > 0;
}

export function hasVerifiedReviewsForHomepage(): boolean {
  return collectTopVerifiedReviewsFromSeed(1).length > 0;
}
