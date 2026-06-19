"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/context/AuthContext";
import {
  getOrganizerReviewsForCabinet,
  getOrganizerReviewsSummary,
} from "@/lib/organizer-reviews";
import { isSupabaseReviewsEnabled } from "@/lib/auth-mode";
import { REVIEWS_UPDATED_EVENT, type TouristReview } from "@/types/tourist";
import { cabinetCardClass, cabinetHeroClass } from "@/lib/cabinet-ui";
import { cn } from "@/lib/cn";

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Оценка ${rating} из 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn(
            "h-4 w-4",
            index < rating ? "fill-amber-400 text-amber-400" : "text-gray-200"
          )}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

export default function OrganizerReviewsView() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({ count: 0, averageRating: null as number | null });
  const [reviews, setReviews] = useState<TouristReview[]>([]);

  useEffect(() => {
    if (!user) return;

    async function refresh() {
      if (isSupabaseReviewsEnabled()) {
        try {
          const res = await fetch("/api/organizer/reviews");
          if (res.ok) {
            const json = (await res.json()) as {
              reviews?: TouristReview[];
              summary?: { count: number; averageRating: number | null };
            };
            setReviews(json.reviews ?? []);
            setSummary(json.summary ?? { count: 0, averageRating: null });
            return;
          }
        } catch {
          // fallback
        }
      }

      setReviews(getOrganizerReviewsForCabinet(user!.id));
      setSummary(getOrganizerReviewsSummary(user!.id));
    }

    void refresh();
    function onUpdated() {
      void refresh();
    }
    window.addEventListener(REVIEWS_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(REVIEWS_UPDATED_EVENT, onUpdated);
  }, [user]);

  const hasReviews = reviews.length > 0;

  const heroText = useMemo(() => {
    if (!hasReviews) return "Пока нет опубликованных отзывов по вашим турам.";
    if (summary.averageRating != null) {
      return `${summary.count} отзыв${summary.count === 1 ? "" : summary.count < 5 ? "а" : "ов"} · средняя оценка ${summary.averageRating}`;
    }
    return `${summary.count} отзывов`;
  }, [hasReviews, summary]);

  return (
    <div className="space-y-6">
      <header className={cabinetHeroClass}>
        <h1 className="font-heading text-2xl font-bold text-charcoal sm:text-3xl">Отзывы</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate">{heroText}</p>
        <p className="mt-3 text-xs text-slate">
          Показаны только опубликованные отзывы после модерации платформы.
        </p>
      </header>

      {!hasReviews ? (
        <EmptyState
          icon={Star}
          title="Отзывов пока нет"
          description="Когда туристы оставят отзывы на ваши туры, они появятся здесь после проверки."
        />
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className={cn(cabinetCardClass, "p-5")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <Link
                    href={`/tours/${review.tourSlug}`}
                    className="font-medium text-charcoal hover:text-sky"
                  >
                    {review.tourTitle}
                  </Link>
                  <p className="text-xs text-slate">{formatWhen(review.updatedAt)}</p>
                </div>
                <RatingStars rating={review.rating} />
              </div>
              {review.text ? (
                <p className="mt-3 text-sm leading-relaxed text-charcoal">{review.text}</p>
              ) : null}
              {review.tripDate ? (
                <p className="mt-2 text-xs text-slate">Поездка: {formatWhen(review.tripDate)}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
