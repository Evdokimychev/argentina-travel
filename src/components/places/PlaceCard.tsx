"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, Star } from "lucide-react";
import { PLACE_CATEGORY_LABELS } from "@/types/place";
import type { PlaceListing } from "@/types/place";
import { placeHref } from "@/lib/places-repository";
import PlaceFavoriteButton from "@/components/places/PlaceFavoriteButton";
import { favoriteOverlayButtonClass } from "@/lib/favorite-button-styles";
import { cn } from "@/lib/cn";

export default function PlaceCard({
  place,
  className,
}: {
  place: PlaceListing;
  className?: string;
}) {
  return (
    <Link
      href={placeHref(place.slug)}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {place.coverImage ? (
          <Image
            src={place.coverImage}
            alt={place.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gray-100 text-slate">Нет фото</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/20 to-transparent" />
        <div className="absolute left-3 top-3">
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-white backdrop-blur-sm">
            {PLACE_CATEGORY_LABELS[place.category]}
          </span>
        </div>
        <div className="absolute right-3 top-3">
          <PlaceFavoriteButton
            place={place}
            className={favoriteOverlayButtonClass}
            iconClassName="h-4 w-4"
          />
        </div>
        <div className="absolute bottom-0 p-4 text-white">
          <p className="flex items-center gap-1 text-xs text-white/75">
            <MapPin className="h-3 w-3" aria-hidden />
            {place.region}
          </p>
          <h3 className="mt-1 font-heading text-lg font-bold">{place.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-white/85">{place.shortDescription}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/80">
            {place.rating != null ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 backdrop-blur-sm">
                <Star className="h-3 w-3 fill-amber-300 text-amber-300" aria-hidden />
                {place.rating.toFixed(1)}
              </span>
            ) : null}
            {place.visitDuration ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 backdrop-blur-sm">
                <Clock className="h-3 w-3" aria-hidden />
                {place.visitDuration}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
