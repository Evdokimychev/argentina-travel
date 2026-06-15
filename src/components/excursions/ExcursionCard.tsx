"use client";

import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import TourCardGallery from "@/components/marketplace/TourCardGallery";
import TourPriceDisplay from "@/components/tour-detail/TourPriceDisplay";
import ExcursionFavoriteButton from "@/components/excursions/ExcursionFavoriteButton";
import { StarRating } from "@/components/ui/star-rating";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/cn";
import { tourCardShellClass, tourCardShellInteractiveClass } from "@/lib/tour-card-shell";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { formatExcursionDuration } from "@/lib/excursion-format";
import {
  excursionFormatLabelKey,
  excursionPriceSuffixKey,
} from "@/lib/excursion-listing-meta";
import { resolveExcursionPriceUsd } from "@/lib/excursion-price-display";
import { formatShortDisplayName } from "@/lib/full-name";
import { buildExcursionGuideHref } from "@/lib/tripster/guide-mapper";
import type { ExcursionListing } from "@/types/excursion";

export default function ExcursionCard({ excursion }: { excursion: ExcursionListing }) {
  const { t } = useLocaleCurrency();
  const durationLabel = formatExcursionDuration(excursion.durationMinutes, t);
  const priceUsd = resolveExcursionPriceUsd(excursion);
  const showFrom = excursion.priceFrom !== false;
  const priceUnit = excursion.priceUnit ?? "per_person";
  const formatKind = excursion.formatKind ?? "group";
  const galleryImages = excursion.coverImage ? [excursion.coverImage] : [];
  const hasReviews = excursion.rating != null && excursion.reviewCount > 0;
  const guideLabel = excursion.guide
    ? formatShortDisplayName(excursion.guide.name)
    : null;

  return (
    <article
      className={cn("group relative flex flex-col", tourCardShellClass, tourCardShellInteractiveClass)}
    >
      <div className="pointer-events-none relative z-10 flex flex-1 flex-col">
        <div className="relative aspect-[4/3] overflow-hidden">
          <TourCardGallery images={galleryImages} alt={excursion.title} />

          <ExcursionFavoriteButton
            excursion={excursion}
            className="pointer-events-auto absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
          />

          {excursion.guide && guideLabel ? (
            <Link
              href={buildExcursionGuideHref(excursion.guide.id)}
              className="pointer-events-auto absolute bottom-3 left-3 z-20 flex items-center gap-2 rounded-full bg-charcoal/60 py-1 pl-1 pr-3 backdrop-blur-sm transition hover:bg-charcoal/75"
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
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-1.5 text-slate">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate/70" aria-hidden />
              <span className="truncate">{excursion.cityName}</span>
            </span>
            {hasReviews ? (
              <StarRating
                layout="badge"
                score={excursion.rating!.toFixed(1)}
                count={excursion.reviewCount}
                size="sm"
              />
            ) : (
              <StarRating layout="badge" isNew newLabel={t("excursions.card.new")} size="sm" />
            )}
          </div>

          <h3 className="mt-2 line-clamp-2 font-heading text-lg font-bold leading-snug text-charcoal group-hover:text-sky">
            {excursion.title}
          </h3>

          {excursion.tagline ? (
            <p className="mt-1 line-clamp-2 text-xs text-slate">{excursion.tagline}</p>
          ) : null}

          <div className="mt-3 flex items-center justify-between gap-2">
            {priceUsd != null ? (
              <TourPriceDisplay
                priceUsd={priceUsd}
                size="sm"
                showFrom={showFrom}
                suffix={t(excursionPriceSuffixKey(priceUnit))}
              />
            ) : excursion.priceDisplay ? (
              <p className="text-xs leading-snug text-slate">{excursion.priceDisplay}</p>
            ) : (
              <p className="text-xs text-slate">{t("excursions.priceOnPartner")}</p>
            )}
            {durationLabel ? (
              <p className="inline-flex shrink-0 items-center gap-1 self-end text-xs leading-none text-slate">
                <Clock className="h-3.5 w-3.5 text-slate/70" aria-hidden />
                {durationLabel}
              </p>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-gray-100 pt-3">
            <span className="rounded-md bg-gray-50 px-2 py-0.5 text-[11px] text-slate">
              {t("excursions.card.kind")}
            </span>
            <span className="rounded-md bg-gray-50 px-2 py-0.5 text-[11px] text-slate">
              {t(excursionFormatLabelKey(formatKind))}
            </span>
          </div>
        </div>
      </div>

      <Link
        href={`/excursions/${excursion.slug}`}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 focus-visible:ring-offset-2"
        aria-label={`${t("excursions.card.open")}: ${excursion.title}`}
      />
    </article>
  );
}
