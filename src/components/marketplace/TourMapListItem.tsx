"use client";

import Image from "next/image";
import Link from "next/link";
import { ReviewRatingBadge } from "@/components/ui/review-rating-badge";
import { TourListing } from "@/types";
import TourPublicPriceDisplay from "@/components/tour-detail/TourPublicPriceDisplay";
import { cn } from "@/lib/cn";
import { tourCardShellClass } from "@/lib/tour-card-shell";
import { formatDays } from "@/lib/pluralize";
import { formatTourLocationCompactPlain } from "@/lib/geo";
import { resolveTourRatingLabel } from "@/lib/tour-public-display";

interface TourMapListItemProps {
  tour: TourListing;
  selected?: boolean;
  onSelect: () => void;
  listItemRef?: (el: HTMLLIElement | null) => void;
}

export default function TourMapListItem({
  tour,
  selected,
  onSelect,
  listItemRef,
}: TourMapListItemProps) {
  const ratingDisplay = resolveTourRatingLabel(tour);
  const cityDisplay = formatTourLocationCompactPlain(tour);

  return (
    <li ref={listItemRef} data-tour-id={tour.id}>
      <article
        className={cn(
          "flex gap-3 p-4 transition-colors",
          tourCardShellClass,
          "border-b border-gray-100 last:border-b-0 last:rounded-b-2xl first:rounded-t-2xl",
          selected ? "bg-brand-light/40 ring-1 ring-sky/20" : "hover:bg-gray-50/80"
        )}
      >
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 gap-3 text-left"
        >
          <div className="relative h-[72px] w-[88px] shrink-0 overflow-hidden rounded-xl">
            <Image
              src={tour.image}
              alt=""
              fill
              className="object-cover"
              sizes="88px"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-charcoal">
              {tour.title}
            </h3>
            <p className="mt-1 truncate text-xs text-slate">{cityDisplay}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate">
              {ratingDisplay.hasReviews ? (
                <ReviewRatingBadge
                  score={ratingDisplay.ratingText}
                  reviewCount={tour.reviewCount}
                  size="sm"
                />
              ) : (
                <ReviewRatingBadge isNew newLabel={ratingDisplay.badgeLabel} size="sm" />
              )}
              <span>{formatDays(tour.durationDays)}</span>
            </div>
          </div>
        </button>

        <div className="flex shrink-0 flex-col items-end justify-between gap-2">
          <TourPublicPriceDisplay
            priceUsd={tour.priceUsd}
            originalPriceUsd={tour.originalPriceUsd}
            priceOnRequest={tour.priceOnRequest}
            priceFromPrefix={tour.priceFromPrefix}
            size="sm"
            showFrom={false}
            density="compact"
          />
          <Link
            href={`/tours/${tour.slug}`}
            className="text-xs font-medium text-brand hover:underline"
          >
            Подробнее
          </Link>
        </div>
      </article>
    </li>
  );
}
