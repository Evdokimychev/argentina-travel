"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buildReviewHref, bookingNeedsReview } from "@/lib/tourist-review-cta";
import { isSupabaseReviewsEnabled } from "@/lib/auth-mode";
import type { Booking, TouristReview } from "@/types/tourist";

export default function BookingReviewCta({
  booking,
  userId,
  className,
}: {
  booking: Booking;
  userId: string;
  className?: string;
}) {
  const [reviews, setReviews] = useState<TouristReview[] | null>(null);

  useEffect(() => {
    if (!isSupabaseReviewsEnabled()) {
      setReviews([]);
      return;
    }

    let cancelled = false;
    void fetch("/api/reviews", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return [] as TouristReview[];
        const json = (await res.json()) as { reviews?: TouristReview[] };
        return json.reviews ?? [];
      })
      .then((items) => {
        if (!cancelled) setReviews(items);
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (reviews === null) return null;
  if (!bookingNeedsReview(booking, userId, reviews)) return null;

  return (
    <Link
      href={buildReviewHref(booking)}
      className={
        className ??
        "inline-flex items-center rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
      }
    >
      Оставить отзыв
    </Link>
  );
}
