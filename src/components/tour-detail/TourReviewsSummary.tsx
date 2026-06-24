"use client";

import { ChevronRight } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { ReviewRatingBadge } from "@/components/ui/review-rating-badge";
import { StarRating } from "@/components/ui/star-rating";
import { cn } from "@/lib/cn";
import { formatReviews } from "@/lib/pluralize";
import type { TourReview } from "@/types";

export function collectTourReviewPhotos(reviews: TourReview[]): string[] {
  const urls: string[] = [];
  for (const review of reviews) {
    for (const photo of review.photos) {
      if (photo && !urls.includes(photo)) urls.push(photo);
    }
  }
  return urls;
}

function RatingDistributionBar({
  stars,
  count,
  total,
}: {
  stars: number;
  count: number;
  total: number;
}) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="grid grid-cols-[2rem_1fr_2rem] items-center gap-2 text-xs">
      <span className="font-medium tabular-nums text-slate">{stars}</span>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-sun transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-right tabular-nums text-slate/80">{count}</span>
    </div>
  );
}

type TourReviewsSummaryProps = {
  reviews: TourReview[];
  rating: number;
  reviewCount: number;
  ratingCounts: Map<number, number>;
  headingNote?: string;
  onPhotosClick?: () => void;
  className?: string;
};

export default function TourReviewsSummary({
  reviews,
  rating,
  reviewCount,
  ratingCounts,
  headingNote,
  onPhotosClick,
  className,
}: TourReviewsSummaryProps) {
  const photos = collectTourReviewPhotos(reviews);
  const previewPhotos = photos.slice(0, 5);
  const ratingScore = rating > 0 ? rating.toFixed(1) : undefined;

  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-100 bg-gradient-to-br from-sky/[0.04] to-white p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          {ratingScore ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-heading text-4xl font-bold tabular-nums leading-none text-charcoal">
                {ratingScore}
              </p>
              <div>
                <StarRating stars={Math.round(rating)} size="md" />
                <p className="mt-1 text-sm text-slate">{formatReviews(reviewCount)}</p>
              </div>
            </div>
          ) : (
            <ReviewRatingBadge isNew newLabel={formatReviews(reviewCount)} size="lg" />
          )}
          {headingNote ? (
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-slate">{headingNote}</p>
          ) : null}
        </div>

        {photos.length > 0 ? (
          <button
            type="button"
            onClick={onPhotosClick}
            className="group relative shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 focus-visible:ring-offset-2"
            aria-label={`Фото путешественников: ${photos.length}`}
          >
            <div className="flex items-center pb-1 pl-1 pr-16 pt-3">
              {previewPhotos.map((photo, index) => (
                <div
                  key={photo}
                  className={cn(
                    "relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-white shadow-md transition group-hover:shadow-lg sm:h-16 sm:w-16",
                    index > 0 && "-ml-5",
                  )}
                  style={{ zIndex: index }}
                >
                  <SafeImage src={photo} alt="" fill className="object-cover" sizes="64px" />
                </div>
              ))}
            </div>
            <span className="absolute bottom-0 right-0 inline-flex items-center gap-0.5 rounded-full border border-gray-100 bg-white px-3 py-1.5 text-sm font-medium text-charcoal shadow-md transition group-hover:border-sky/30 group-hover:text-sky">
              {photos.length} фото
              <ChevronRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            </span>
          </button>
        ) : null}
      </div>

      {reviewCount > 0 ? (
        <div className="mt-5 max-w-sm space-y-1.5 border-t border-gray-100 pt-4">
          {[5, 4, 3, 2, 1].map((stars) => (
            <RatingDistributionBar
              key={stars}
              stars={stars}
              count={ratingCounts.get(stars) ?? 0}
              total={reviewCount}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
