"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserReviews, submitReviewForModeration } from "@/lib/reviews-store";
import { REVIEWS_UPDATED_EVENT, type TouristReview } from "@/types/tourist";
import { REVIEW_STATUS_LABELS } from "@/data/tourist-dashboard";
import { formatDateShortWithYear } from "@/lib/utils";
import { getReviewListingHref } from "@/lib/review-listing-link";
import { isSupabaseReviewsEnabled } from "@/lib/auth-mode";
import { cn } from "@/lib/cn";
import {
  cabinetCardClass,
  cabinetLinkClass,
  cabinetPageSubtitleClass,
  cabinetPageTitleClass,
  cabinetPanelClass,
} from "@/lib/cabinet-ui";
import { EmptyState } from "@/components/ui/empty-state";

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Оценка ${rating} из 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn(
            "h-4 w-4",
            index < rating ? "fill-sun text-sun" : "text-gray-200"
          )}
        />
      ))}
    </div>
  );
}

function statusBadgeClass(status: TouristReview["status"]): string {
  switch (status) {
    case "published":
      return "bg-emerald-50 text-emerald-800";
    case "pending":
      return "bg-amber-50 text-amber-800";
    case "rejected":
      return "bg-red-50 text-red-700";
    default:
      return "bg-gray-100 text-slate";
  }
}

export default function ProfileReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<TouristReview[]>([]);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function refresh() {
      if (isSupabaseReviewsEnabled()) {
        try {
          const res = await fetch("/api/reviews");
          if (res.ok) {
            const json = (await res.json()) as { reviews?: TouristReview[] };
            if (json.reviews?.length) {
              setReviews(json.reviews);
              return;
            }
          }
        } catch {
          // fallback below
        }
      }
      setReviews(getUserReviews(user!.id));
    }

    void refresh();
    function onUpdated() {
      void refresh();
    }
    window.addEventListener(REVIEWS_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(REVIEWS_UPDATED_EVENT, onUpdated);
  }, [user]);

  async function handleSubmit(reviewId: string) {
    if (!user) return;
    setSubmittingId(reviewId);
    try {
      await submitReviewForModeration(reviewId, user);
      if (isSupabaseReviewsEnabled()) {
        const res = await fetch("/api/reviews");
        if (res.ok) {
          const json = (await res.json()) as { reviews?: TouristReview[] };
          setReviews(json.reviews ?? []);
          return;
        }
      }
      setReviews(getUserReviews(user.id));
    } finally {
      setSubmittingId(null);
    }
  }

  if (!user) return null;

  return (
    <div className={cabinetPanelClass}>
      <h1 className={cabinetPageTitleClass}>Мои отзывы</h1>
      <p className={cabinetPageSubtitleClass}>
        Отзывы о турах после поездки. Перед публикацией на сайте отзыв проходит модерацию.
      </p>

      {reviews.length > 0 ? (
        <ul className="mt-6 space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className={cn(cabinetCardClass, "p-4 sm:p-5")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={getReviewListingHref(review)}
                    className="font-medium text-charcoal transition-colors hover:text-sky"
                  >
                    {review.tourTitle}
                  </Link>
                  <div className="mt-2">
                    <RatingStars rating={review.rating} />
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                    statusBadgeClass(review.status)
                  )}
                >
                  {REVIEW_STATUS_LABELS[review.status]}
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate">{review.text}</p>

              {review.status === "rejected" && review.moderationNotes ? (
                <p className="mt-2 text-xs text-red-600">
                  Комментарий модератора: {review.moderationNotes}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate">
                <span>
                  {review.tripDate
                    ? `Поездка: ${formatDateShortWithYear(review.tripDate)}`
                    : `Создан: ${formatDateShortWithYear(review.createdAt.slice(0, 10))}`}
                </span>
                {review.status === "draft" || review.status === "rejected" ? (
                  <button
                    type="button"
                    disabled={submittingId === review.id}
                    onClick={() => void handleSubmit(review.id)}
                    className={cabinetLinkClass}
                  >
                    {submittingId === review.id ? "Отправка…" : "Отправить на модерацию"}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={MessageSquare}
          title="Отзывов пока нет"
          description="После завершённой поездки вы сможете оставить отзыв о туре."
          className="mt-8"
        />
      )}
    </div>
  );
}
