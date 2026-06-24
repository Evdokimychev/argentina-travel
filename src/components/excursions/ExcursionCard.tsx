"use client";

import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import TourCardGallery from "@/components/marketplace/TourCardGallery";
import TourPriceDisplay from "@/components/tour-detail/TourPriceDisplay";
import ExcursionFavoriteButton from "@/components/excursions/ExcursionFavoriteButton";
import { favoriteOverlayButtonClass } from "@/lib/favorite-button-styles";
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
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { formatExcursionDuration } from "@/lib/excursion-format";
import {
  excursionFormatLabelKey,
  excursionPriceSuffixKey,
} from "@/lib/excursion-listing-meta";
import { resolveExcursionPriceUsd } from "@/lib/excursion-price-display";
import { formatShortDisplayName } from "@/lib/full-name";
import { buildExcursionGuideHref } from "@/lib/tripster/guide-mapper";
import type { ExcursionListing, ExcursionPartner } from "@/types/excursion";

function partnerBadgeVariant(partner: ExcursionPartner): "new" | "hit" {
  return partner === "tripster" ? "new" : "hit";
}

function partnerBadgeLabel(partner: ExcursionPartner, t: (key: string) => string): string {
  return partner === "sputnik8" ? t("excursions.partner.sputnik8") : t("excursions.partner.tripster");
}

export default function ExcursionCard({ excursion }: { excursion: ExcursionListing }) {
  const { t } = useLocaleCurrency();
  const durationLabel = formatExcursionDuration(excursion.durationMinutes, t);
  const priceUsd = resolveExcursionPriceUsd(excursion);
  const showFrom = excursion.priceFrom !== false;
  const priceUnit = excursion.priceUnit ?? "per_person";
  const formatKind = excursion.formatKind ?? "group";
  const galleryImages = excursion.coverImage ? [excursion.coverImage] : [];
  const hasReviews = excursion.rating != null && excursion.reviewCount > 0;
  const guideLabel = excursion.guide ? formatShortDisplayName(excursion.guide.name) : null;

  return (
    <ContentCard>
      <div className="pointer-events-none relative z-10 flex flex-1 flex-col">
        <ContentCardMedia aspect="4/3" gradient="none">
          <TourCardGallery images={galleryImages} alt={excursion.title} />

          <div className="absolute left-3 top-3 z-10">
            <Badge variant={partnerBadgeVariant(excursion.partner)}>
              {partnerBadgeLabel(excursion.partner, t)}
            </Badge>
          </div>

          <ExcursionFavoriteButton
            excursion={excursion}
            className={cn(favoriteOverlayButtonClass, "absolute right-3 top-3 z-10")}
            iconClassName="h-4 w-4"
          />

          {excursion.guide && guideLabel ? (
            <Link
              href={buildExcursionGuideHref(excursion.guide.id)}
              className="pointer-events-auto absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-full bg-charcoal/60 py-1 pl-1 pr-3 backdrop-blur-sm transition hover:bg-charcoal/75"
              aria-label={`${t("excursions.guide.profile")}: ${guideLabel}`}
            >
              <div className="relative h-7 w-7 overflow-hidden rounded-full">
                <SafeImage
                  src={excursion.guide.avatar ?? ""}
                  alt={guideLabel}
                  fill
                  placeholderVariant="avatar"
                  className="object-cover"
                  sizes="28px"
                />
              </div>
              <span className="max-w-[9rem] truncate text-xs font-medium text-white">
                {guideLabel}
              </span>
            </Link>
          ) : null}
        </ContentCardMedia>

        <ContentCardBody>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-1.5 text-slate">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate/70" aria-hidden />
              <span className="truncate">{excursion.cityName}</span>
            </span>
            {hasReviews ? (
              <ReviewRatingBadge
                score={excursion.rating!.toFixed(1).replace(".", ",")}
                reviewCount={excursion.reviewCount}
                size="sm"
              />
            ) : (
              <ReviewRatingBadge isNew newLabel={t("excursions.card.new")} size="sm" />
            )}
          </div>

          <ContentCardTitle>{excursion.title}</ContentCardTitle>

          {excursion.tagline ? (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate">{excursion.tagline}</p>
          ) : null}

          <div className="mt-3 flex flex-col gap-0.5">
            <div className="flex items-baseline justify-between gap-2">
              {priceUsd != null ? (
                <TourPriceDisplay
                  priceUsd={priceUsd}
                  size="sm"
                  showFrom={showFrom}
                  suffix={t(excursionPriceSuffixKey(priceUnit))}
                />
              ) : excursion.priceDisplay ? (
                <p className="text-sm font-semibold text-charcoal">{excursion.priceDisplay}</p>
              ) : (
                <p className="text-sm text-slate">{t("excursions.priceOnPartner")}</p>
              )}
              {durationLabel ? (
                <p className="inline-flex shrink-0 items-center gap-1 self-baseline text-xs text-slate">
                  <Clock className="h-3.5 w-3.5 text-slate/70" aria-hidden />
                  {durationLabel}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-gray-100 pt-3">
            <span className="rounded-md bg-gray-50 px-2 py-0.5 text-[11px] text-slate">
              {t(excursionFormatLabelKey(formatKind))}
            </span>
          </div>
        </ContentCardBody>
      </div>

      <ContentCardOverlayLink
        href={`/excursions/${excursion.slug}`}
        ariaLabel={`${t("excursions.card.open")}: ${excursion.title}`}
      />
    </ContentCard>
  );
}
