"use client";

import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { StarRating } from "@/components/ui/star-rating";
import { cn } from "@/lib/cn";
import { tourCardShellClass, tourCardShellInteractiveClass } from "@/lib/tour-card-shell";
import ExcursionFavoriteButton from "@/components/excursions/ExcursionFavoriteButton";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { formatExcursionDuration } from "@/lib/excursion-format";
import type { ExcursionListing } from "@/types/excursion";

export default function ExcursionCard({ excursion }: { excursion: ExcursionListing }) {
  const { t } = useLocaleCurrency();
  const durationLabel = formatExcursionDuration(excursion.durationMinutes, t);
  const priceLabel =
    excursion.priceDisplay ||
    (excursion.priceValue != null
      ? `${Math.round(excursion.priceValue)} ${excursion.priceCurrency ?? ""}`.trim()
      : null);

  return (
    <article className={cn("group flex flex-col", tourCardShellClass, tourCardShellInteractiveClass)}>
      <Link href={`/excursions/${excursion.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/3] overflow-hidden">
          <SafeImage
            src={excursion.coverImage ?? ""}
            alt={excursion.title}
            width={640}
            height={480}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {excursion.format ? (
            <span className="absolute left-3 top-3 rounded-full bg-charcoal/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {excursion.format}
            </span>
          ) : null}
          <div className="absolute right-3 top-3">
            <ExcursionFavoriteButton
              excursion={excursion}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm"
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-center gap-2 text-xs text-slate">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{excursion.cityName}</span>
          </div>

          <h2 className="mt-2 font-heading text-lg font-bold leading-snug text-charcoal group-hover:text-sky">
            {excursion.title}
          </h2>

          {excursion.tagline ? (
            <p className="mt-1 line-clamp-2 text-sm text-slate">{excursion.tagline}</p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            {excursion.rating != null && excursion.reviewCount > 0 ? (
              <StarRating
                layout="badge"
                score={excursion.rating.toFixed(1)}
                count={excursion.reviewCount}
                size="sm"
              />
            ) : null}
            {durationLabel ? (
              <span className="flex items-center gap-1 text-slate">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {durationLabel}
              </span>
            ) : null}
          </div>

          {priceLabel ? (
            <p className="mt-4 font-heading text-lg font-bold text-charcoal">{priceLabel}</p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
