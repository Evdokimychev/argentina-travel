"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";
import { TourReview } from "@/types";
import { deriveTourReviewStats, stripStaticSeedReviews } from "@/lib/tour-review-stats";
import { EmptyState } from "@/components/ui/empty-state";
import TourSection from "./TourSection";
import TourReviewCard from "./TourReviewCard";
import TourReviewsSummary from "./TourReviewsSummary";
import {
  tourDetailContentStackClass,
  tourDetailFilterChipClass,
  tourDetailSecondaryButtonClass,
} from "@/lib/tour-detail-ui";
import { cn } from "@/lib/cn";

const PER_PAGE = 5;
const FILTER_STARS = [5, 4, 3] as const;

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
    return visibleReviews.filter((review) => Math.round(review.rating) === filter);
  }, [visibleReviews, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const { rating: displayRating, reviewCount: displayCount } = deriveTourReviewStats(visibleReviews);

  const scrollToFirstReviewWithPhotos = () => {
    const target = document.querySelector<HTMLElement>("[data-review-with-photos]");
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

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
    <TourSection id="reviews" title="Отзывы" collapsibleOnMobile={false}>
      <TourReviewsSummary
        reviews={visibleReviews}
        rating={displayRating}
        reviewCount={displayCount}
        ratingCounts={ratingCounts}
        headingNote={headingNote}
        onPhotosClick={scrollToFirstReviewWithPhotos}
        className="mb-5"
      />

      {filterOptions.length > 1 ? (
        <div className="mb-5 flex flex-wrap gap-2">
          {filterOptions.map((value) => {
            const count =
              value === "all" ? visibleReviews.length : (ratingCounts.get(value) ?? 0);

            return (
              <button
                key={String(value)}
                type="button"
                onClick={() => {
                  setFilter(value);
                  setPage(1);
                }}
                className={cn(
                  tourDetailFilterChipClass,
                  filter === value
                    ? "bg-sky text-white"
                    : "border border-gray-200 bg-white text-slate hover:border-gray-300",
                )}
              >
                {value === "all" ? `Все (${count})` : `${value} ★ (${count})`}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className={tourDetailContentStackClass}>
        {paginated.map((review, index) => (
          <TourReviewCard
            key={review.id}
            review={review}
            withPhotosAnchor={index === 0 && review.photos.length > 0}
          />
        ))}
      </div>

      {totalPages > 1 ? (
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
      ) : null}
    </TourSection>
  );
}
