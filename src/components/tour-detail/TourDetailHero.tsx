"use client";

import { useState } from "react";
import { Heart, MapPin, Share2 } from "lucide-react";
import { TourDetail } from "@/types";
import { cn } from "@/lib/cn";
import { formatReviews } from "@/lib/pluralize";
import TourDurationInfo from "./TourDurationInfo";

interface TourDetailHeroProps {
  tour: TourDetail;
}

export default function TourDetailHero({ tour }: TourDetailHeroProps) {
  const [favorited, setFavorited] = useState(false);
  const [shared, setShared] = useState(false);

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
          <button
            type="button"
            onClick={() => setFavorited(!favorited)}
            aria-label={favorited ? "Убрать из избранного" : "Добавить в избранное"}
            aria-pressed={favorited}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
              favorited
                ? "border-wine bg-wine/5 text-wine"
                : "border-gray-200 bg-white text-charcoal hover:border-gray-300"
            )}
          >
            <Heart className={cn("h-4 w-4", favorited && "fill-current")} />
          </button>
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
        <span className="flex items-center gap-1 rounded-lg bg-sun/15 px-2.5 py-1 text-sm font-semibold">
          <svg className="h-4 w-4 text-sun" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {tour.rating}
        </span>
        <button type="button" className="text-sm text-sky hover:underline">
          {formatReviews(tour.reviewCount)}
        </button>
      </div>
    </div>
  );
}
