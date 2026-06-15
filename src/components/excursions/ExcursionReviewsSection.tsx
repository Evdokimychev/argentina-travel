"use client";

import { useEffect, useMemo, useState } from "react";
import UserAvatar from "@/components/auth/UserAvatar";
import ExcursionReviewsSummary from "@/components/excursions/ExcursionReviewsSummary";
import TourSection from "@/components/tour-detail/TourSection";
import { SafeImage } from "@/components/ui/safe-image";
import { StarRating } from "@/components/ui/star-rating";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { formatDate } from "@/lib/utils";
import type { ExcursionReview } from "@/types/excursion";

const PER_PAGE = 5;
const FILTER_STARS = [5, 4, 3] as const;

function countReviewsByStar(reviews: ExcursionReview[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const review of reviews) {
    const stars = Math.round(review.rating ?? 0);
    if (stars >= 1 && stars <= 5) {
      counts.set(stars, (counts.get(stars) ?? 0) + 1);
    }
  }
  return counts;
}

type ExcursionReviewsSectionProps = {
  reviews: ExcursionReview[];
  rating?: number;
  reviewCount?: number;
  visitorsCount?: number;
};

function formatReviewMeta(review: ExcursionReview): string | null {
  const parts: string[] = [];
  if (review.tripDate) parts.push(`Экскурсия: ${formatDate(review.tripDate)}`);
  if (review.createdAt) parts.push(`Отзыв: ${formatDate(review.createdAt)}`);
  return parts.length ? parts.join(" · ") : null;
}

export default function ExcursionReviewsSection({
  reviews,
  rating,
  reviewCount,
  visitorsCount,
}: ExcursionReviewsSectionProps) {
  const { t, locale } = useLocaleCurrency();
  const [filter, setFilter] = useState<number | "all">("all");
  const [page, setPage] = useState(1);

  const ratingCounts = useMemo(() => countReviewsByStar(reviews), [reviews]);

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
    if (filter === "all") return reviews;
    return reviews.filter((review) => Math.round(review.rating ?? 0) === filter);
  }, [reviews, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (!reviews.length) return null;

  const scrollToFirstReviewWithPhotos = () => {
    const target = document.querySelector<HTMLElement>("[data-review-with-photos]");
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <TourSection id="reviews" title={t("excursions.section.reviews")}>
      <ExcursionReviewsSummary
        reviews={reviews}
        rating={rating}
        reviewCount={reviewCount ?? reviews.length}
        visitorsCount={visitorsCount}
        locale={locale}
        t={t}
        onPhotosClick={scrollToFirstReviewWithPhotos}
        className="mb-4"
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {filterOptions.map((value) => (
          <button
            key={String(value)}
            type="button"
            onClick={() => {
              setFilter(value);
              setPage(1);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === value
                ? "bg-sky text-white"
                : "border border-gray-200 bg-white text-slate hover:border-gray-300"
            }`}
          >
            {value === "all" ? t("excursions.reviews.filterAll") : `${value} ★`}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {paginated.map((review) => {
          const authorName = review.authorName ?? t("excursions.reviewGuest");
          const meta = formatReviewMeta(review);

          return (
            <article
              key={review.id}
              data-review-with-photos={review.photos?.length ? "" : undefined}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <UserAvatar
                  name={authorName}
                  avatarUrl={review.authorAvatar}
                  className="h-11 w-11 text-sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-charcoal">{authorName}</p>
                    {review.rating != null ? (
                      <StarRating
                        layout="badge"
                        score={review.rating.toFixed(1)}
                        size="sm"
                      />
                    ) : null}
                  </div>

                  {meta ? <p className="mt-1 text-xs text-slate">{meta}</p> : null}

                  {review.text ? (
                    <p className="mt-3 text-sm leading-relaxed text-slate">{review.text}</p>
                  ) : null}

                  {review.photos && review.photos.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {review.photos.map((photo) => (
                        <div
                          key={photo}
                          className="relative h-20 w-28 overflow-hidden rounded-xl border border-gray-100"
                        >
                          <SafeImage
                            src={photo}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="112px"
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm disabled:opacity-40"
          >
            {t("excursions.prev")}
          </button>
          <span className="text-sm text-slate">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm disabled:opacity-40"
          >
            {t("excursions.next")}
          </button>
        </div>
      ) : null}
    </TourSection>
  );
}
