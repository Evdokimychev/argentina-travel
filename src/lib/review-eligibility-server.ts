import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { fetchUserBookings } from "@/lib/bookings-server";
import { fetchUserReviews } from "@/lib/reviews-server";
import {
  resolveReviewEligibility,
  type ReviewEligibilityResult,
} from "@/lib/review-eligibility";

type DbClient = SupabaseClient<Database>;

export async function fetchReviewEligibilityForUser(
  supabase: DbClient,
  userId: string,
  tourSlug: string,
  options?: { isPartnerTour?: boolean }
): Promise<ReviewEligibilityResult> {
  const [bookings, reviews] = await Promise.all([
    fetchUserBookings(supabase, userId),
    fetchUserReviews(supabase, userId),
  ]);

  return resolveReviewEligibility({
    tourSlug,
    bookings,
    reviews,
    isPartnerTour: options?.isPartnerTour,
  });
}
