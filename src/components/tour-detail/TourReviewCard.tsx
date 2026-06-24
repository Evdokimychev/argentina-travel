"use client";

import { BadgeCheck, CalendarDays, MessageSquareQuote } from "lucide-react";
import UserAvatar from "@/components/auth/UserAvatar";
import ExpandableText from "@/components/ui/expandable-text";
import { SafeImage } from "@/components/ui/safe-image";
import { StarRating } from "@/components/ui/star-rating";
import { cn } from "@/lib/cn";
import { formatDateOptional } from "@/lib/utils";
import type { TourReview } from "@/types";
import ReviewReportButton from "./ReviewReportButton";

type ReviewSourceBadge = {
  label: string;
  className: string;
};

function resolveReviewSourceBadge(source?: TourReview["source"]): ReviewSourceBadge | null {
  if (source === "platform") {
    return { label: "Платформа", className: "bg-sky/10 text-sky" };
  }
  if (source === "tripster") {
    return { label: "Tripster", className: "bg-amber-100 text-amber-900" };
  }
  if (source === "youtravel") {
    return { label: "YouTravel.me", className: "bg-violet-100 text-violet-900" };
  }
  return null;
}

function formatReviewMeta(review: TourReview): string | null {
  const parts: string[] = [];
  const tripDateLabel = formatDateOptional(review.tripDate);
  const reviewDateLabel = formatDateOptional(review.date);

  if (tripDateLabel) parts.push(`Поездка: ${tripDateLabel}`);
  if (reviewDateLabel) parts.push(`Отзыв: ${reviewDateLabel}`);

  return parts.length ? parts.join(" · ") : null;
}

export default function TourReviewCard({
  review,
  withPhotosAnchor,
}: {
  review: TourReview;
  withPhotosAnchor?: boolean;
}) {
  const meta = formatReviewMeta(review);
  const organizerRepliedAtLabel = formatDateOptional(review.organizerRepliedAt);
  const sourceBadge = resolveReviewSourceBadge(review.source);
  const ratingScore = review.rating > 0 ? review.rating.toFixed(1) : undefined;
  const visiblePhotos = review.photos.slice(0, 6);
  const hiddenPhotoCount = Math.max(0, review.photos.length - visiblePhotos.length);

  return (
    <article
      data-review-with-photos={withPhotosAnchor && review.photos.length ? "" : undefined}
      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-4">
        <UserAvatar name={review.author} avatarUrl={review.avatar} className="h-12 w-12 text-base" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-base font-semibold text-charcoal">{review.author}</p>
              {meta ? (
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                  {meta}
                </p>
              ) : null}
            </div>
            {ratingScore ? (
              <StarRating layout="badge" score={ratingScore} size="sm" className="shrink-0" />
            ) : (
              <StarRating stars={review.rating} size="sm" className="shrink-0" />
            )}
          </div>

          {review.verifiedTrip || sourceBadge ? (
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {review.verifiedTrip ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
                  <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Подтверждённая поездка
                </span>
              ) : null}
              {sourceBadge ? (
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium",
                    sourceBadge.className,
                  )}
                >
                  {sourceBadge.label}
                </span>
              ) : null}
            </div>
          ) : null}

          {review.text ? (
            <ExpandableText
              text={review.text}
              previewLength={320}
              className="mt-4"
              paragraphClassName="whitespace-pre-line break-words text-sm leading-relaxed text-charcoal/90"
              expandLabel="Читать полностью"
              collapseLabel="Свернуть"
            />
          ) : null}

          {visiblePhotos.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {visiblePhotos.map((photo, index) => (
                <a
                  key={photo}
                  href={photo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-[4/3] overflow-hidden rounded-xl border border-gray-100 bg-gray-50 transition hover:border-sky/30 hover:shadow-md"
                >
                  <SafeImage src={photo} alt="" fill className="object-cover" sizes="180px" />
                  {index === visiblePhotos.length - 1 && hiddenPhotoCount > 0 ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-charcoal/45 text-sm font-semibold text-white">
                      +{hiddenPhotoCount}
                    </span>
                  ) : null}
                </a>
              ))}
            </div>
          ) : null}

          {review.organizerReply ? (
            <div className="mt-4 rounded-xl border border-sky/15 bg-sky/[0.04] p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-sky">
                <MessageSquareQuote className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Ответ организатора
              </p>
              {organizerRepliedAtLabel ? (
                <p className="mt-1 text-[11px] text-slate">Опубликован: {organizerRepliedAtLabel}</p>
              ) : null}
              <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-charcoal/90">
                {review.organizerReply}
              </p>
            </div>
          ) : null}

          {review.source === "platform" ? (
            <div className="mt-3">
              <ReviewReportButton reviewId={review.id} />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
