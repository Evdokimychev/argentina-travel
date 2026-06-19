import { NextResponse } from "next/server";
import { isSupabaseReviewsEnabled } from "@/lib/auth-mode";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { fetchUserReviews, insertReview } from "@/lib/reviews-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TouristReview } from "@/types/tourist";

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

  const reviews = await fetchUserReviews(supabase, user.id);
  return NextResponse.json({ reviews });
}

type PostBody = {
  review?: TouristReview;
  organizerTourId?: string;
};

export async function POST(request: Request) {
  if (!isSupabaseReviewsEnabled()) {
    return NextResponse.json({ error: "Reviews API unavailable" }, { status: 503 });
  }

  const ip = getClientIp(request);
  const limit = checkRateLimit(`reviews:ip:${ip}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов. Повторите позже." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as PostBody;
  const review = body.review;

  if (!review?.tourId || !review.tourSlug || !review.tourTitle) {
    return NextResponse.json({ error: "Некорректные данные отзыва" }, { status: 400 });
  }

  const normalized: TouristReview = {
    ...review,
    id: review.id || `review-${crypto.randomUUID().slice(0, 8)}`,
    userId: user.id,
    status: review.status === "draft" ? "draft" : "draft",
    photos: review.photos ?? [],
    createdAt: review.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const result = await insertReview(supabase, normalized, {
    organizerTourId: body.organizerTourId,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ review: result.review });
}
