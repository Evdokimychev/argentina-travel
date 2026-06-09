"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, MapPin } from "lucide-react";
import { TourListing } from "@/types";
import TourPriceDisplay from "@/components/tour-detail/TourPriceDisplay";
import { cn } from "@/lib/cn";
import { formatDays } from "@/lib/pluralize";

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
  const hasReviews = tour.reviewCount > 0;

  return (
    <li ref={listItemRef} data-tour-id={tour.id}>
      <article
        className={cn(
          "flex gap-3 border-b border-gray-100 p-4 transition-colors last:border-b-0",
          selected ? "bg-brand-light/40" : "hover:bg-gray-50/80"
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
            <p className="mt-1 flex items-center gap-1 text-xs text-slate">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{tour.destination}</span>
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate">
              {hasReviews && (
                <span className="inline-flex items-center gap-0.5 font-medium text-charcoal">
                  <Star className="h-3 w-3 fill-sun text-sun" aria-hidden />
                  {tour.rating.toFixed(1)}
                </span>
              )}
              <span>{formatDays(tour.durationDays)}</span>
            </div>
          </div>
        </button>

        <div className="flex shrink-0 flex-col items-end justify-between gap-2">
          <TourPriceDisplay
            priceUsd={tour.priceUsd}
            originalPriceUsd={tour.originalPriceUsd}
            size="sm"
            showFrom={false}
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
