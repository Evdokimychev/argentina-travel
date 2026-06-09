"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Star, Flame, MapPin, UserRound } from "lucide-react";
import { TourListing, TourBadge } from "@/types";
import TourPriceDisplay from "@/components/tour-detail/TourPriceDisplay";
import TourCardGallery from "./TourCardGallery";
import { formatDateShort } from "@/lib/utils";
import { formatDurationShort, formatMoreDates } from "@/lib/pluralize";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

const BADGE_CONFIG: Record<TourBadge, { label: string; variant: "hot" | "new" | "hit" | "family" | "expedition" }> = {
  hot: { label: "Горящий", variant: "hot" },
  new: { label: "Новинка", variant: "new" },
  hit: { label: "Хит", variant: "hit" },
  family: { label: "Семейный", variant: "family" },
  expedition: { label: "Экспедиция", variant: "expedition" },
};

interface MarketplaceTourCardProps {
  tour: TourListing;
}

export default function MarketplaceTourCard({ tour }: MarketplaceTourCardProps) {
  const [fav, setFav] = useState(false);
  const nextDate = tour.availableDates[0];
  const moreDates = tour.availableDates.length - 1;
  const hasReviews = tour.reviewCount > 0;

  return (
    <Link
      href={`/tours/${tour.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <TourCardGallery images={tour.gallery} alt={tour.title} />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {tour.isHot && (
            <Badge variant="hot">
              <Flame className="h-3 w-3" /> Горящий
            </Badge>
          )}
          {tour.badges
            .filter((b) => !(b === "hot" && tour.isHot))
            .slice(0, 2)
            .map((b) => (
              <Badge key={b} variant={BADGE_CONFIG[b].variant}>
                {BADGE_CONFIG[b].label}
              </Badge>
            ))}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setFav(!fav);
          }}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
          aria-label="В избранное"
        >
          <Heart
            className={cn("h-4 w-4", fav ? "fill-wine text-wine" : "text-charcoal")}
          />
        </button>

        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-charcoal/60 py-1 pl-1 pr-3 backdrop-blur-sm">
          <div className="relative h-7 w-7 overflow-hidden rounded-full">
            <Image
              src={tour.organizer.avatar}
              alt={tour.organizer.name}
              fill
              className="object-cover"
              sizes="28px"
            />
          </div>
          <span className="text-xs font-medium text-white">{tour.organizer.name}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="flex min-w-0 items-center gap-1.5 text-slate">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate/70" aria-hidden />
            <span className="truncate">{tour.region}</span>
          </span>
          {hasReviews ? (
            <span className="flex shrink-0 items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-sun text-sun" />
              <span className="font-semibold text-charcoal">{tour.rating}</span>
              <span className="text-slate">({tour.reviewCount})</span>
            </span>
          ) : (
            <span className="flex shrink-0 items-center gap-1 text-brand">
              <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
              <span className="font-medium">Новый</span>
            </span>
          )}
        </div>

        <h3 className="mt-2 line-clamp-2 font-semibold leading-snug text-charcoal group-hover:text-brand">
          {tour.title}
        </h3>

        <div className="mt-3 flex items-center justify-between gap-2">
          <TourPriceDisplay
            priceUsd={tour.priceUsd}
            originalPriceUsd={tour.originalPriceUsd}
            size="sm"
          />
          <p className="shrink-0 text-xs leading-none text-slate">
            {formatDurationShort(tour.durationDays, tour.durationNights)}
          </p>
        </div>

        {nextDate && tour.bookingMode !== "on_request" && (
          <p className="mt-2 text-xs text-slate">
            {formatDateShort(nextDate.start)} – {formatDateShort(nextDate.end)}
            {moreDates > 0 && (
              <span className="ml-1 text-brand">{formatMoreDates(moreDates)}</span>
            )}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-gray-100 pt-3">
          {tour.bookingMode === "on_request" && (
            <span className="inline-flex items-center gap-1 rounded-md border border-sky/15 bg-sky/5 px-2 py-0.5 text-[11px] font-medium text-sky">
              <UserRound className="h-3 w-3 shrink-0" aria-hidden />
              Индивидуально
            </span>
          )}
          <span className="rounded-md bg-gray-50 px-2 py-0.5 text-[11px] text-slate">
            {tour.activityType}
          </span>
          <span className="rounded-md bg-gray-50 px-2 py-0.5 text-[11px] text-slate">
            {tour.groupSizeBucket}
          </span>
          <span className="rounded-md bg-gray-50 px-2 py-0.5 text-[11px] text-slate">
            {tour.comfortLevel}
          </span>
          <span className="rounded-md bg-gray-50 px-2 py-0.5 text-[11px] text-slate">
            {tour.difficultyLevel}
          </span>
        </div>
      </div>
    </Link>
  );
}
