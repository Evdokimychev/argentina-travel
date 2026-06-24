"use client";

import { ChevronRight } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { ReviewRatingBadge } from "@/components/ui/review-rating-badge";
import { cn } from "@/lib/cn";
import { formatReviews } from "@/lib/pluralize";
import type { LocaleCode } from "@/types/locale";
import type { ExcursionReview } from "@/types/excursion";

const LOCALE_NUMBER: Record<LocaleCode, string> = {
  ru: "ru-RU",
  en: "en-US",
  es: "es-ES",
  pt: "pt-BR",
};

export function collectTravelerReviewPhotos(reviews: ExcursionReview[]): string[] {
  const urls: string[] = [];
  for (const review of reviews) {
    for (const photo of review.photos ?? []) {
      if (photo && !urls.includes(photo)) urls.push(photo);
    }
  }
  return urls;
}

type ExcursionReviewsSummaryProps = {
  reviews: ExcursionReview[];
  rating?: number;
  reviewCount?: number;
  visitorsCount?: number;
  locale: LocaleCode;
  t: (key: string) => string;
  onPhotosClick?: () => void;
  className?: string;
};

export default function ExcursionReviewsSummary({
  reviews,
  rating,
  reviewCount,
  visitorsCount,
  locale,
  t,
  onPhotosClick,
  className,
}: ExcursionReviewsSummaryProps) {
  const photos = collectTravelerReviewPhotos(reviews);
  const previewPhotos = photos.slice(0, 5);

  const metaParts: string[] = [];
  if (visitorsCount != null && visitorsCount > 0) {
    metaParts.push(t("excursions.reviews.visited").replace("{count}", String(visitorsCount)));
  }

  const ratingScore =
    rating != null
      ? rating.toLocaleString(LOCALE_NUMBER[locale], {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
      : undefined;
  const hasReviews = ratingScore != null && (reviewCount ?? 0) > 0;

  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        {hasReviews ? (
          <ReviewRatingBadge score={ratingScore} reviewCount={reviewCount} size="lg" />
        ) : ratingScore ? (
          <ReviewRatingBadge score={ratingScore} size="lg" />
        ) : reviewCount != null && reviewCount > 0 ? (
          <ReviewRatingBadge isNew newLabel={formatReviews(reviewCount)} size="lg" />
        ) : null}
        {metaParts.length > 0 ? (
          <p className="mt-1.5 text-sm text-slate">{metaParts.join(", ")}</p>
        ) : null}
      </div>

      {photos.length > 0 ? (
        <button
          type="button"
          onClick={onPhotosClick}
          className="group relative shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 focus-visible:ring-offset-2"
          aria-label={t("excursions.reviews.photoCount").replace("{count}", String(photos.length))}
        >
          <div className="flex items-center pb-1 pl-1 pr-16 pt-3">
            {previewPhotos.map((photo, index) => (
              <div
                key={photo}
                className={cn(
                  "relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-white shadow-md transition group-hover:shadow-lg sm:h-16 sm:w-16",
                  index > 0 && "-ml-5"
                )}
                style={{ zIndex: index }}
              >
                <SafeImage
                  src={photo}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            ))}
          </div>
          <span className="absolute bottom-0 right-0 inline-flex items-center gap-0.5 rounded-full border border-gray-100 bg-white px-3 py-1.5 text-sm font-medium text-charcoal shadow-md transition group-hover:border-sky/30 group-hover:text-sky">
            {t("excursions.reviews.photoCount").replace("{count}", String(photos.length))}
            <ChevronRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          </span>
        </button>
      ) : null}
    </div>
  );
}
