"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import type { TourListing } from "@/types";
import TourPublicPriceDisplay from "@/components/tour-detail/TourPublicPriceDisplay";
import { SafeImage } from "@/components/ui/safe-image";
import { formatDurationShort } from "@/lib/pluralize";
import { cn } from "@/lib/cn";
import { tourCardShellClass, tourCardShellInteractiveClass } from "@/lib/tour-card-shell";
import { resolveTourRatingLabel } from "@/lib/tour-public-display";

interface TourEmbedCompactCardProps {
  tour: TourListing;
  layout?: "vertical" | "horizontal";
  className?: string;
}

export default function TourEmbedCompactCard({
  tour,
  layout = "vertical",
  className,
}: TourEmbedCompactCardProps) {
  const rating = resolveTourRatingLabel(tour);
  const href = `/tours/${tour.slug}`;

  if (layout === "horizontal") {
    return (
      <Link
        href={href}
        className={cn(
          "group flex gap-3 p-3",
          tourCardShellClass,
          tourCardShellInteractiveClass,
          className
        )}
      >
        <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl">
          <SafeImage
            src={tour.image}
            alt={tour.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="112px"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-charcoal group-hover:text-sky">
            {tour.title}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate">{tour.destination}</span>
            <span aria-hidden>·</span>
            <span>{formatDurationShort(tour.durationDays, tour.durationNights)}</span>
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <TourPublicPriceDisplay
              priceUsd={tour.priceUsd}
              originalPriceUsd={tour.originalPriceUsd}
              priceOnRequest={tour.priceOnRequest}
              priceFromPrefix={tour.priceFromPrefix}
              size="sm"
              showFrom={false}
              density="compact"
            />
            {rating.hasReviews ? (
              <span className="text-xs text-slate">{rating.ratingText}</span>
            ) : null}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "group flex w-[260px] shrink-0 snap-start flex-col sm:w-[280px]",
        tourCardShellClass,
        tourCardShellInteractiveClass,
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <SafeImage
          src={tour.image}
          alt={tour.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="280px"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-charcoal group-hover:text-sky">
          {tour.title}
        </h3>
        <p className="mt-1.5 flex items-center gap-1 text-xs text-slate">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden />
          <span className="truncate">{tour.destination}</span>
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <TourPublicPriceDisplay
            priceUsd={tour.priceUsd}
            originalPriceUsd={tour.originalPriceUsd}
            priceOnRequest={tour.priceOnRequest}
            priceFromPrefix={tour.priceFromPrefix}
            size="sm"
            showFrom={false}
            density="compact"
          />
          <span className="text-xs text-slate">
            {formatDurationShort(tour.durationDays, tour.durationNights)}
          </span>
        </div>
      </div>
    </Link>
  );
}
