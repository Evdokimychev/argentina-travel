"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Flame, UserRound } from "lucide-react";
import FavoriteButton from "@/components/profile/FavoriteButton";
import { favoriteOverlayButtonClass } from "@/lib/favorite-button-styles";
import { TourListing, TourBadge } from "@/types";
import TourPublicPriceDisplay from "@/components/tour-detail/TourPublicPriceDisplay";
import TourCardGallery from "./TourCardGallery";
import { formatDurationShort } from "@/lib/pluralize";
import { Badge } from "@/components/ui/badge";
import { ReviewRatingBadge } from "@/components/ui/review-rating-badge";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/cn";
import {
  ContentCard,
  ContentCardBody,
  ContentCardMedia,
  ContentCardOverlayLink,
  ContentCardTitle,
} from "@/components/content/ContentCard";
import { formatTourLocationCompactPlain } from "@/lib/geo";
import { resolveListingComfortLevel } from "@/lib/tour-accommodation";
import { buildOrganizerPublicHref } from "@/lib/organizer-public";
import { avatarAlt, tourCoverAlt } from "@/lib/media-alt-text";
import { resolveTourRatingLabel, resolveTourCardScheduleDisplay } from "@/lib/tour-public-display";
import { resolvePartnerTourBadge } from "@/lib/partner-tours/badge";
import { isPartnerTourListing } from "@/lib/tripster/partner-tour-utils";
import { formatShortDisplayName } from "@/lib/full-name";
import { plainTextFromRichContent } from "@/lib/rich-text";
import TourDepartureDatesModal from "./TourDepartureDatesModal";
import TourCardDepartureSchedule from "./TourCardDepartureSchedule";
import { formatTourGroupSizeLabel } from "@/lib/tour-group-size-display";
import { formatYouTravelListedPrice } from "@/lib/youtravel/offers-mapper";
import {
  TourListingOverlayBadges,
  TourListingThematicTags,
} from "./TourListingCatalogBadges";

const BADGE_CONFIG: Record<TourBadge, { label: string; variant: "hot" | "new" | "hit" | "family" | "expedition" }> = {
  hot: { label: "Горящий", variant: "hot" },
  new: { label: "Новинка", variant: "new" },
  hit: { label: "Хит", variant: "hit" },
  family: { label: "Семейный", variant: "family" },
  expedition: { label: "Экспедиция", variant: "expedition" },
};

interface MarketplaceTourCardProps {
  tour: TourListing;
  /** First grid card on catalog — LCP hint for /tours. */
  imagePriority?: boolean;
}

export default function MarketplaceTourCard({ tour, imagePriority = false }: MarketplaceTourCardProps) {
  const router = useRouter();
  const [datesModalOpen, setDatesModalOpen] = useState(false);
  const schedule = resolveTourCardScheduleDisplay(tour);
  const ratingDisplay = resolveTourRatingLabel(tour);
  const groupDiscountHint = tour.groupDiscountHint;
  const comfortLevel = resolveListingComfortLevel(tour);
  const organizerHref =
    tour.organizer.slug ?? tour.organizerOwnerId
      ? buildOrganizerPublicHref(tour.organizer.slug ?? tour.organizerOwnerId!)
      : null;
  const organizerLabel = formatShortDisplayName(tour.organizer.name);
  const cityDisplay = formatTourLocationCompactPlain(tour);
  const isPartnerTour = isPartnerTourListing(tour);
  const partnerBadge = resolvePartnerTourBadge(tour);

  return (
    <ContentCard>
      <div className="pointer-events-none relative z-10 flex flex-1 flex-col">
        <ContentCardMedia aspect="4/3" gradient="none">
          <TourCardGallery
            images={tour.gallery}
            alt={tourCoverAlt(tour.title)}
            variant="tour"
            priority={imagePriority}
          />

          <div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-3.5rem)] flex-wrap gap-1.5">
            {partnerBadge ? (
              <Badge
                variant="expedition"
                title={partnerBadge.hint}
                className="border-white/25 bg-charcoal/90 text-white backdrop-blur-sm shadow-sm"
              >
                {partnerBadge.label}
              </Badge>
            ) : null}
            <TourListingOverlayBadges tour={tour} className="border-white/20 backdrop-blur-sm" />
            {tour.isHot && (
              <Badge variant="hot" className="border-white/20 backdrop-blur-sm">
                <Flame className="h-3 w-3" /> Горящий
              </Badge>
            )}
            {tour.badges
              .filter((b) => !(b === "hot" && tour.isHot))
              .slice(0, 2)
              .map((b) => (
                <Badge
                  key={b}
                  variant={BADGE_CONFIG[b].variant}
                  className="border-white/20 backdrop-blur-sm"
                >
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
            className={cn(favoriteOverlayButtonClass, "absolute right-3 top-3 z-10")}
            iconClassName="h-4 w-4"
          />

          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-full bg-charcoal/60 py-1 pl-1 pr-3 backdrop-blur-sm">
            <div className="relative h-7 w-7 overflow-hidden rounded-full">
              <SafeImage
                src={tour.organizer.avatar}
                alt={avatarAlt(organizerLabel)}
                fill
                placeholderVariant="avatar"
                placeholderCompact
                className="object-cover"
                sizes="28px"
              />
            </div>
            {organizerHref ? (
              <button
                type="button"
                onClick={() => router.push(organizerHref)}
                className="pointer-events-auto -my-1.5 min-h-6 py-1.5 text-xs font-medium text-white hover:underline"
              >
                {organizerLabel}
              </button>
            ) : (
              <span className="text-xs font-medium text-white">{organizerLabel}</span>
            )}
          </div>
        </ContentCardMedia>

        <ContentCardBody>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-1.5 text-slate">
              <span className="truncate">{cityDisplay}</span>
            </span>
            {ratingDisplay.hasReviews ? (
              <ReviewRatingBadge
                score={ratingDisplay.ratingText}
                reviewCount={tour.reviewCount}
                size="sm"
              />
            ) : (
              <ReviewRatingBadge isNew newLabel={ratingDisplay.badgeLabel} size="sm" />
            )}
          </div>

          <ContentCardTitle>{tour.title}</ContentCardTitle>

          {tour.shortDescription ? (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate">
              {plainTextFromRichContent(tour.shortDescription)}
            </p>
          ) : null}

          <div className="mt-3 flex flex-col gap-0.5">
            <div className="flex items-baseline justify-between gap-2">
              <TourPublicPriceDisplay
                priceUsd={tour.priceUsd}
                originalPriceUsd={tour.originalPriceUsd}
                priceOnRequest={tour.priceOnRequest}
                priceFromPrefix={tour.priceFromPrefix}
                size="sm"
                density="compact"
              />
              <p className="shrink-0 self-baseline text-xs text-slate">
                {formatDurationShort(tour.durationDays, tour.durationNights)}
              </p>
            </div>
            {tour.partnerPriceDisplay ? (
              <p className="text-[11px] text-slate">
                {tour.partnerOriginalPriceValue != null &&
                tour.partnerPriceValue != null &&
                tour.partnerOriginalPriceValue > tour.partnerPriceValue ? (
                  <>
                    <span className="mr-1.5 line-through decoration-brand/50">
                      {formatYouTravelListedPrice(
                        tour.partnerOriginalPriceValue,
                        tour.partnerPriceCurrency,
                      )}
                    </span>
                    <span className="font-medium text-charcoal">{tour.partnerPriceDisplay}</span>
                  </>
                ) : (
                  tour.partnerPriceDisplay
                )}
              </p>
            ) : null}
          </div>

          {schedule?.type === "individual" ? (
            <p className="mt-2 text-xs text-slate">{schedule.label}</p>
          ) : schedule?.type === "dates" ? (
            <TourCardDepartureSchedule
              className="mt-2"
              schedule={schedule}
              onMoreDatesClick={
                schedule.moreDates > 0 ? () => setDatesModalOpen(true) : undefined
              }
            />
          ) : null}

          {groupDiscountHint && !tour.priceOnRequest ? (
            <p className="mt-1.5 text-[11px] font-medium text-sky-ink">
              Групповая скидка: {groupDiscountHint}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-gray-100 pt-3">
            {tour.bookingMode === "on_request" && (
              <span className="inline-flex items-center gap-1 rounded-md border border-sky/15 bg-sky/5 px-2 py-0.5 text-[11px] font-medium text-sky-ink">
                <UserRound className="h-3 w-3 shrink-0" aria-hidden />
                Индивидуально
              </span>
            )}
            <span className="rounded-md bg-gray-50 px-2 py-0.5 text-[11px] text-slate">
              {formatTourGroupSizeLabel(tour)}
            </span>
            {isPartnerTour && (tour.partnerThematicTags?.length ?? 0) > 0 ? (
              <TourListingThematicTags tour={tour} />
            ) : (
              <span className="rounded-md bg-gray-50 px-2 py-0.5 text-[11px] text-slate">
                {tour.activityType}
              </span>
            )}
            {!isPartnerTour ? (
              <>
                <span className="rounded-md bg-gray-50 px-2 py-0.5 text-[11px] text-slate">
                  {comfortLevel}
                </span>
                <span className="rounded-md bg-gray-50 px-2 py-0.5 text-[11px] text-slate">
                  {tour.difficultyLevel}
                </span>
              </>
            ) : null}
          </div>
        </ContentCardBody>
      </div>

      <ContentCardOverlayLink
        href={`/tours/${tour.slug}`}
        ariaLabel={`Открыть тур: ${tour.title}`}
      />

      {schedule?.type === "dates" && schedule.moreDates > 0 ? (
        <TourDepartureDatesModal
          tour={tour}
          open={datesModalOpen}
          onOpenChange={setDatesModalOpen}
        />
      ) : null}
    </ContentCard>
  );
}
