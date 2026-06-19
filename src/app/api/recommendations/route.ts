import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getRecommendedExcursions,
  getRecommendedTours,
} from "@/lib/personalization/recommendations-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "all";
  const limit = Math.min(12, Math.max(1, Number(searchParams.get("limit") ?? 6) || 6));

  let userId: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  const cookieStore = await cookies();
  const anonymousId = userId ? null : cookieStore.get("pa_vid")?.value ?? null;

  const context = { userId, anonymousId, limit };

  if (type === "tours") {
    const result = await getRecommendedTours(context);
    return NextResponse.json(result);
  }

  if (type === "excursions") {
    const result = await getRecommendedExcursions(context);
    return NextResponse.json(result);
  }

  const [toursResult, excursionsResult] = await Promise.all([
    getRecommendedTours(context),
    getRecommendedExcursions(context),
  ]);

  return NextResponse.json({
    tours: toursResult.tours,
    toursPersonalized: toursResult.personalized,
    excursions: excursionsResult.excursions,
    excursionsPersonalized: excursionsResult.personalized,
  });
}
