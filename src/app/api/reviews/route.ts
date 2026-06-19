import { NextResponse } from "next/server";
import { isSupabaseReviewsEnabled } from "@/lib/auth-mode";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { fetchReviewEligibilityForUser } from "@/lib/review-eligibility";
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

  const rating = Math.min(5, Math.max(1, Math.round(review.rating)));
  const text = review.text?.trim() ?? "";
  if (!text) {
    return NextResponse.json({ error: "Напишите текст отзыва" }, { status: 400 });
  }

  const eligibility = await fetchReviewEligibilityForUser(supabase, user.id, review.tourSlug);
  if (!eligibility.eligible && !eligibility.existingReview) {
    return NextResponse.json({ error: eligibility.message }, { status: 403 });
  }

  if (
    eligibility.existingReview?.status === "published" ||
    eligibility.existingReview?.status === "pending"
  ) {
    return NextResponse.json({ error: eligibility.message }, { status: 409 });
  }

  const reviewId = eligibility.existingReview?.id ?? review.id ?? `review-${crypto.randomUUID().slice(0, 8)}`;
  const bookingId = review.bookingId ?? eligibility.bookingId ?? eligibility.existingReview?.bookingId;

  const normalized: TouristReview = {
    ...review,
    id: reviewId,
    userId: user.id,
    bookingId,
    rating,
    text,
    status: "draft",
    photos: review.photos ?? [],
    tripDate: review.tripDate ?? eligibility.tripDate ?? eligibility.existingReview?.tripDate,
    createdAt: eligibility.existingReview?.createdAt ?? review.createdAt ?? new Date().toISOString(),
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
