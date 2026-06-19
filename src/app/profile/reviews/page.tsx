"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserReviews, updateReviewStatus } from "@/lib/reviews-store";
import { REVIEWS_UPDATED_EVENT, type TouristReview } from "@/types/tourist";
import { REVIEW_STATUS_LABELS } from "@/data/tourist-dashboard";
import { formatDateShortWithYear } from "@/lib/utils";
import { getReviewListingHref } from "@/lib/review-listing-link";
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

export default function ProfileReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<TouristReview[]>([]);

  useEffect(() => {
    if (!user) return;

    function refresh() {
      setReviews(getUserReviews(user!.id));
    }

    refresh();
    window.addEventListener(REVIEWS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(REVIEWS_UPDATED_EVENT, refresh);
  }, [user]);

  if (!user) return null;

  return (
    <div className={cabinetPanelClass}>
      <h1 className={cabinetPageTitleClass}>Мои отзывы</h1>
      <p className={cabinetPageSubtitleClass}>
        Отзывы о турах и экскурсиях после поездки. Публикация — после модерации организатора.
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
                    review.status === "published"
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-gray-100 text-slate"
                  )}
                >
                  {REVIEW_STATUS_LABELS[review.status]}
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate">{review.text}</p>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate">
                <span>
                  {review.tripDate
                    ? `Поездка: ${formatDateShortWithYear(review.tripDate)}`
                    : `Создан: ${formatDateShortWithYear(review.createdAt.slice(0, 10))}`}
                </span>
                {review.status === "draft" ? (
                  <button
                    type="button"
                    onClick={() => user && updateReviewStatus(review.id, "published", user)}
                    className={cabinetLinkClass}
                  >
                    Отправить на публикацию
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
