"use client";

import { useState } from "react";
import { MapPin, Share2 } from "lucide-react";
import { TourDetail } from "@/types";
import { cn } from "@/lib/cn";
import { formatReviews } from "@/lib/pluralize";
import TourDurationInfo from "./TourDurationInfo";
import FavoriteButton from "@/components/profile/FavoriteButton";
import { StarRating } from "@/components/ui/star-rating";
import { resolveTourRatingLabel } from "@/lib/tour-public-display";

interface TourDetailHeroProps {
  tour: TourDetail;
}

export default function TourDetailHero({ tour }: TourDetailHeroProps) {
  const [shared, setShared] = useState(false);
  const ratingDisplay = resolveTourRatingLabel(tour);

  async function handleShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: tour.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // User cancelled share or clipboard unavailable
    }
  }

  function scrollToReviews() {
    document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-1.5 text-sm text-slate">
          <MapPin className="h-4 w-4 shrink-0 text-slate/70" aria-hidden />
          <span className="truncate">
            {tour.region}, {tour.country}
          </span>
        </p>

        <div className="flex shrink-0 items-center gap-1.5">
          <FavoriteButton
            tourId={tour.id}
            tourSlug={tour.slug}
            tourTitle={tour.title}
            tourImage={tour.image}
            region={tour.region}
            country={tour.country}
            priceUsd={tour.priceUsd}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
              "border-gray-200 bg-white text-charcoal hover:border-gray-300"
            )}
          />
          <button
            type="button"
            onClick={handleShare}
            aria-label={shared ? "Ссылка скопирована" : "Поделиться"}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-charcoal transition-colors hover:border-gray-300"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4">
        <h1 className="min-w-0 flex-1 font-display text-2xl font-bold leading-tight text-charcoal sm:text-3xl lg:text-4xl">
          {tour.title}
        </h1>
        <TourDurationInfo
          days={tour.durationDays}
          nights={tour.durationNights}
          className="ml-auto"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {ratingDisplay.hasReviews ? (
          <>
            <button
              type="button"
              onClick={scrollToReviews}
              className="flex items-center gap-1.5 rounded-lg bg-sun/15 px-2.5 py-1 transition-colors hover:bg-sun/25"
            >
              <StarRating layout="badge" score={ratingDisplay.ratingText} size="md" />
            </button>
            <button
              type="button"
              onClick={scrollToReviews}
              className="text-sm text-sky hover:underline"
            >
              {formatReviews(tour.reviewCount)}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={scrollToReviews}
            className="transition-colors hover:text-sky-dark"
          >
            <StarRating layout="badge" isNew newLabel={ratingDisplay.badgeLabel} size="md" />
          </button>
        )}
      </div>
    </div>
  );
}
