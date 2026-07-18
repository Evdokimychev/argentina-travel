"use client";

import Image from "next/image";
import { Clock, MapPin } from "lucide-react";
import { PLACE_CATEGORY_LABELS } from "@/types/place";
import type { PlaceListing } from "@/types/place";
import { placeHref } from "@/lib/places-urls";
import PlaceFavoriteButton from "@/components/places/PlaceFavoriteButton";
import { favoriteOverlayButtonClass } from "@/lib/favorite-button-styles";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import {
  OverlayCardLink,
  OverlayMetaChip,
  OverlayTopPill,
  overlayGradientClass,
  overlayMediaHoverClass,
} from "@/components/content/ContentCardOverlay";

export default function PlaceCard({
  place,
  className,
  imagePriority = false,
}: {
  place: PlaceListing;
  className?: string;
  imagePriority?: boolean;
}) {
  return (
    <OverlayCardLink href={placeHref(place.slug)} ariaLabel={place.name} className={className}>
      <div className="relative aspect-[4/3] overflow-hidden">
        {place.coverImage ? (
          <Image
            src={place.coverImage}
            alt={place.name}
            fill
            priority={imagePriority}
            fetchPriority={imagePriority ? "high" : undefined}
            className={overlayMediaHoverClass}
            sizes="(max-width: 768px) 100vw, 25vw"
          />
        ) : (
          <ImagePlaceholder className="absolute inset-0" ariaLabel={place.name} />
        )}
        <div className={overlayGradientClass} />
        <div className="absolute left-3 top-3">
          <OverlayTopPill>{PLACE_CATEGORY_LABELS[place.category]}</OverlayTopPill>
        </div>
        <div className="absolute right-3 top-3">
          <PlaceFavoriteButton
            place={place}
            className={favoriteOverlayButtonClass}
            iconClassName="h-4 w-4"
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <p className="flex items-center gap-1 text-xs text-white/75">
            <MapPin className="h-3 w-3" aria-hidden />
            {place.region}
          </p>
          <h3 className="mt-1 font-heading text-lg font-bold">{place.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-white/85">{place.shortDescription}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/80">
            {place.visitDuration ? (
              <OverlayMetaChip icon={Clock}>{place.visitDuration}</OverlayMetaChip>
            ) : null}
          </div>
        </div>
      </div>
    </OverlayCardLink>
  );
}
