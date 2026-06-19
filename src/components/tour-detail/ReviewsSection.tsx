"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { TourReview } from "@/types";
import { formatDateOptional } from "@/lib/utils";
import { formatReviews } from "@/lib/pluralize";
import { deriveTourReviewStats, stripStaticSeedReviews } from "@/lib/tour-review-stats";
import { EmptyState } from "@/components/ui/empty-state";
import { StarRating } from "@/components/ui/star-rating";
import TourSection from "./TourSection";
import ReviewReportButton from "./ReviewReportButton";
import {
  tourDetailContentStackClass,
  tourDetailFilterChipClass,
  tourDetailReviewCardClass,
  tourDetailSecondaryButtonClass,
} from "@/lib/tour-detail-ui";
import { cn } from "@/lib/cn";

const PER_PAGE = 3;
const FILTER_STARS = [5, 4, 3] as const;

type ReviewSourceBadge = {
  label: string;
  className: string;
};

function resolveReviewSourceBadge(source?: TourReview["source"]): ReviewSourceBadge | null {
  if (source === "platform") {
    return {
      label: "Отзыв с платформы",
      className: "bg-sky/10 text-sky",
    };
  }
  if (source === "tripster") {
    return {
      label: "Отзыв партнёра",
      className: "bg-amber-100 text-amber-800",
    };
  }
  return null;
}

function countReviewsByStar(reviews: TourReview[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const review of reviews) {
    const stars = Math.round(review.rating);
    if (stars >= 1 && stars <= 5) {
      counts.set(stars, (counts.get(stars) ?? 0) + 1);
    }
  }
  return counts;
}

export default function ReviewsSection({
  reviews,
  headingNote,
}: {
  reviews: TourReview[];
  /** @deprecated Derived from reviews.length */
  rating?: number;
  /** @deprecated Derived from reviews.length */
  reviewCount?: number;
  /** Пояснение под заголовком (например, отзывы с других туров гида). */
  headingNote?: string;
}) {
  const visibleReviews = useMemo(() => stripStaticSeedReviews(reviews), [reviews]);
  const [filter, setFilter] = useState<number | "all">("all");
  const [page, setPage] = useState(1);

  const ratingCounts = useMemo(() => countReviewsByStar(visibleReviews), [visibleReviews]);

  const filterOptions = useMemo(() => {
    const options: Array<(typeof FILTER_STARS)[number] | "all"> = ["all"];
    for (const stars of FILTER_STARS) {
      if ((ratingCounts.get(stars) ?? 0) > 0) options.push(stars);
    }
    return options;
  }, [ratingCounts]);

  useEffect(() => {
    if (filter !== "all" && (ratingCounts.get(filter) ?? 0) === 0) {
      setFilter("all");
      setPage(1);
    }
  }, [filter, ratingCounts]);

  const filtered = useMemo(() => {
    if (filter === "all") return visibleReviews;
    return visibleReviews.filter((r) => r.rating === filter);
  }, [visibleReviews, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const { rating: displayRating, reviewCount: displayCount } = deriveTourReviewStats(visibleReviews);

  if (visibleReviews.length === 0) {
    return (
      <TourSection id="reviews" title="Отзывы">
        <EmptyState
          icon={MessageSquare}
          title="Отзывов пока нет"
          description="Будьте первым — оставьте отзыв после поездки."
          bordered={false}
          className="px-0"
        />
      </TourSection>
    );
  }

  return (
    <TourSection
      id="reviews"
      title="Отзывы"
      collapsibleOnMobile={false}
      subtitle={
        headingNote
          ? `${displayRating} · ${formatReviews(displayCount)} · ${headingNote}`
          : `${displayRating} · ${formatReviews(displayCount)}`
      }
    >
      <div className="mb-5 flex flex-wrap gap-2">
        {filterOptions.map((f) => (
          <button
            key={String(f)}
            type="button"
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
            className={cn(
              tourDetailFilterChipClass,
              filter === f
                ? "bg-sky text-white"
                : "border border-gray-200 bg-white text-slate hover:border-gray-300"
            )}
          >
            {f === "all" ? "Все" : `${f} ★`}
          </button>
        ))}
      </div>

      <div className={tourDetailContentStackClass}>
        {paginated.map((review) => {
          const tripDateLabel = formatDateOptional(review.tripDate);
          const reviewDateLabel = formatDateOptional(review.date);
          const organizerRepliedAtLabel = formatDateOptional(review.organizerRepliedAt);
          const sourceBadge = resolveReviewSourceBadge(review.source);
          const dateLine = [tripDateLabel ? `Поездка: ${tripDateLabel}` : null, reviewDateLabel ? `Отзыв: ${reviewDateLabel}` : null]
            .filter(Boolean)
            .join(" · ");

          return (
          <article key={review.id} className={tourDetailReviewCardClass}>
            <div className="flex items-start gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                <SafeImage
                  src={review.avatar}
                  alt={review.author}
                  fill
                  placeholderVariant="avatar"
                  className="object-cover"
                  sizes="40px"
                />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-charcoal">{review.author}</p>
                    {review.verifiedTrip ? (
                      <span className="rounded-full bg-sky/10 px-2 py-0.5 text-[11px] font-medium text-sky">
                        Подтверждённый путешественник
                      </span>
                    ) : null}
                    {sourceBadge ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${sourceBadge.className}`}
                      >
                        {sourceBadge.label}
                      </span>
                    ) : null}
                  </div>
                  <StarRating stars={review.rating} size="md" />
                </div>
                {dateLine ? (
                  <p className="mt-1 text-xs text-slate">{dateLine}</p>
                ) : null}
                {review.text ? (
                  <p className="mt-3 text-sm leading-relaxed text-slate">{review.text}</p>
                ) : null}
                {review.organizerReply ? (
                  <div className="mt-3 rounded-xl border border-sky/20 bg-sky/5 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky">
                      Ответ организатора
                    </p>
                    {organizerRepliedAtLabel ? (
                      <p className="mt-1 text-[11px] text-slate">
                        Опубликован: {organizerRepliedAtLabel}
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm leading-relaxed text-slate">{review.organizerReply}</p>
                  </div>
                ) : null}
                {review.photos.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {review.photos.map((photo) => (
                      <div key={photo} className="relative h-20 w-28 overflow-hidden rounded-lg">
                        <SafeImage src={photo} alt="" fill className="object-cover" sizes="112px" />
                      </div>
                    ))}
                  </div>
                )}
                {review.source === "platform" ? (
                  <ReviewReportButton reviewId={review.id} />
                ) : null}
              </div>
            </div>
          </article>
        );
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className={cn(tourDetailSecondaryButtonClass, "disabled:opacity-40")}
          >
            Назад
          </button>
          <span className="text-sm text-slate">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className={cn(tourDetailSecondaryButtonClass, "disabled:opacity-40")}
          >
            Далее
          </button>
        </div>
      )}
    </TourSection>
  );
}
