"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Star } from "lucide-react";
import type { TourListing } from "@/types";
import TourPublicPriceDisplay from "@/components/tour-detail/TourPublicPriceDisplay";
import { SafeImage } from "@/components/ui/safe-image";
import { Badge } from "@/components/ui/badge";
import { formatDurationShort } from "@/lib/pluralize";
import { cn } from "@/lib/cn";
import { tourCardShellClass, tourCardShellInteractiveClass } from "@/lib/tour-card-shell";
import { resolveTourRatingLabel } from "@/lib/tour-public-display";

interface TourEmbedSpotlightCardProps {
  tour: TourListing;
  className?: string;
}

export default function TourEmbedSpotlightCard({ tour, className }: TourEmbedSpotlightCardProps) {
  const rating = resolveTourRatingLabel(tour);
  const href = `/tours/${tour.slug}`;

  return (
    <Link
      href={href}
      className={cn(
        "group grid overflow-hidden lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]",
        tourCardShellClass,
        tourCardShellInteractiveClass,
        className
      )}
    >
      <div className="relative min-h-[220px] overflow-hidden sm:min-h-[280px]">
        <SafeImage
          src={tour.image}
          alt={tour.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 1024px) 100vw, 55vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/50 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-charcoal/10" />
        {tour.isHot ? (
          <Badge variant="hot" className="absolute left-4 top-4">
            Горящий
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-col justify-center p-5 sm:p-6 lg:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-sky">Рекомендуем</p>
        <h3 className="mt-2 font-heading text-xl font-bold leading-tight text-charcoal group-hover:text-sky sm:text-2xl">
          {tour.title}
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate">{tour.shortDescription}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4 text-sky/70" aria-hidden />
            {tour.destination}
          </span>
          <span aria-hidden>·</span>
          <span>{formatDurationShort(tour.durationDays, tour.durationNights)}</span>
          {rating.hasReviews ? (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                {rating.ratingText}
              </span>
            </>
          ) : null}
        </div>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
          <TourPublicPriceDisplay
            priceUsd={tour.priceUsd}
            originalPriceUsd={tour.originalPriceUsd}
            priceOnRequest={tour.priceOnRequest}
            priceFromPrefix={tour.priceFromPrefix}
            showFrom={tour.priceFromPrefix}
          />
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-sky">
            Подробнее
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}
