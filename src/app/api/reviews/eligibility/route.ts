import { NextResponse } from "next/server";
import { isSupabaseReviewsEnabled } from "@/lib/auth-mode";
import { fetchReviewEligibilityForUser } from "@/lib/review-eligibility";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (!isSupabaseReviewsEnabled()) {
    return NextResponse.json({ error: "Reviews API unavailable" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const tourSlug = searchParams.get("tourSlug")?.trim();
  if (!tourSlug) {
    return NextResponse.json({ error: "Укажите tourSlug" }, { status: 400 });
  }

  const isPartnerTour = searchParams.get("partner") === "1";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const eligibility = await fetchReviewEligibilityForUser(supabase, user.id, tourSlug, {
    isPartnerTour,
  });

  return NextResponse.json({ eligibility });
}
