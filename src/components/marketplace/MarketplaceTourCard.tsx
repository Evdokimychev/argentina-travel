"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, MapPin, UserRound } from "lucide-react";
import FavoriteButton from "@/components/profile/FavoriteButton";
import { TourListing, TourBadge } from "@/types";
import TourPublicPriceDisplay from "@/components/tour-detail/TourPublicPriceDisplay";
import TourCardGallery from "./TourCardGallery";
import { formatDateRange } from "@/lib/utils";
import { formatDurationShort, formatMoreDates } from "@/lib/pluralize";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/cn";
import { tourCardShellClass, tourCardShellInteractiveClass } from "@/lib/tour-card-shell";
import { resolveListingComfortLevel } from "@/lib/tour-accommodation";
import { buildOrganizerPublicHref } from "@/lib/organizer-public";
import { resolveTourRatingLabel, resolveTourCardScheduleDisplay } from "@/lib/tour-public-display";
import { formatShortDisplayName } from "@/lib/full-name";

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
  const router = useRouter();
  const schedule = resolveTourCardScheduleDisplay(tour);
  const ratingDisplay = resolveTourRatingLabel(tour);
  const groupDiscountHint = tour.groupDiscountHint;
  const comfortLevel = resolveListingComfortLevel(tour);
  const organizerHref =
    tour.organizer.slug ?? tour.organizerOwnerId
      ? buildOrganizerPublicHref(tour.organizer.slug ?? tour.organizerOwnerId!)
      : null;
  const organizerLabel = formatShortDisplayName(tour.organizer.name);

  return (
    <article
      className={cn("group relative flex flex-col", tourCardShellClass, tourCardShellInteractiveClass)}
    >
      <div className="pointer-events-none relative z-10 flex flex-1 flex-col">
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

          <FavoriteButton
            tourId={tour.id}
            tourSlug={tour.slug}
            tourTitle={tour.title}
            tourImage={tour.image}
            region={tour.region}
            priceUsd={tour.priceUsd}
            className="pointer-events-auto absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
          />

          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-charcoal/60 py-1 pl-1 pr-3 backdrop-blur-sm">
            <div className="relative h-7 w-7 overflow-hidden rounded-full">
              <SafeImage
                src={tour.organizer.avatar}
                alt={organizerLabel}
                fill
                placeholderVariant="avatar"
                className="object-cover"
                sizes="28px"
              />
            </div>
            {organizerHref ? (
              <button
                type="button"
                onClick={() => router.push(organizerHref)}
                className="pointer-events-auto text-xs font-medium text-white hover:underline"
              >
                {organizerLabel}
              </button>
            ) : (
              <span className="text-xs font-medium text-white">{organizerLabel}</span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-1.5 text-slate">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate/70" aria-hidden />
              <span className="truncate">{tour.region}</span>
            </span>
            {ratingDisplay.hasReviews ? (
              <StarRating
                layout="badge"
                score={ratingDisplay.ratingText}
                count={tour.reviewCount}
                size="sm"
              />
            ) : (
              <StarRating layout="badge" isNew newLabel={ratingDisplay.badgeLabel} size="sm" />
            )}
          </div>

          <h3 className="mt-2 line-clamp-2 font-heading text-lg font-bold leading-snug text-charcoal group-hover:text-sky">
            {tour.title}
          </h3>

          {tour.shortDescription ? (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate">
              {tour.shortDescription}
            </p>
          ) : null}

          <div className="mt-3 flex items-center justify-between gap-2">
            <TourPublicPriceDisplay
              priceUsd={tour.priceUsd}
              originalPriceUsd={tour.originalPriceUsd}
              priceOnRequest={tour.priceOnRequest}
              priceFromPrefix={tour.priceFromPrefix}
              size="sm"
              density="compact"
            />
            <p className="shrink-0 text-xs leading-none text-slate">
              {formatDurationShort(tour.durationDays, tour.durationNights)}
            </p>
          </div>

          {schedule?.type === "individual" ? (
            <p className="mt-2 text-xs text-slate">{schedule.label}</p>
          ) : schedule?.type === "dates" ? (
            <p className="mt-2 text-xs text-slate">
              {formatDateRange(schedule.start, schedule.end)}
              {schedule.moreDates > 0 && (
                <span className="ml-1 text-sky">{formatMoreDates(schedule.moreDates)}</span>
              )}
            </p>
          ) : null}

          {groupDiscountHint && !tour.priceOnRequest ? (
            <p className="mt-1.5 text-[11px] font-medium text-sky-dark">
              Групповая скидка: {groupDiscountHint}
            </p>
          ) : null}

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
              {comfortLevel}
            </span>
            <span className="rounded-md bg-gray-50 px-2 py-0.5 text-[11px] text-slate">
              {tour.difficultyLevel}
            </span>
          </div>
        </div>
      </div>

      <Link
        href={`/tours/${tour.slug}`}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 focus-visible:ring-offset-2"
        aria-label={`Открыть тур: ${tour.title}`}
      />
    </article>
  );
}
