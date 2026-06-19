import { NextResponse } from "next/server";
import { isSupabaseReviewsEnabled } from "@/lib/auth-mode";
import { getOrganizerCatalogSlugs } from "@/lib/organizer-bookings";
import { fetchOrganizerPublishedReviews } from "@/lib/reviews-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { userHasAccountRole } from "@/types/user";

export async function GET() {
  if (!isSupabaseReviewsEnabled()) {
    return NextResponse.json({ error: "Reviews API unavailable" }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionUser = await loadSessionUserFromSupabase(supabase);
  if (!sessionUser || !userHasAccountRole(sessionUser, "organizer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const slugs = getOrganizerCatalogSlugs(sessionUser.id);
  const reviews = await fetchOrganizerPublishedReviews(supabase, sessionUser.id, slugs);

  const count = reviews.length;
  const averageRating =
    count === 0
      ? null
      : Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / count) * 10) / 10;

  return NextResponse.json({
    reviews,
    summary: { count, averageRating },
  });
}
