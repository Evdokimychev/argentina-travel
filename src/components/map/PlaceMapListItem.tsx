"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { MapPlacePoint } from "@/lib/map-types";
import { PLACE_CATEGORY_LABELS, type PlaceCategory } from "@/types/place";
import { placeHref } from "@/lib/places-repository";
import { cn } from "@/lib/cn";

interface PlaceMapListItemProps {
  place: MapPlacePoint;
  selected?: boolean;
  onSelect: () => void;
  listItemRef?: (el: HTMLLIElement | null) => void;
}

export default function PlaceMapListItem({
  place,
  selected,
  onSelect,
  listItemRef,
}: PlaceMapListItemProps) {
  const category =
    PLACE_CATEGORY_LABELS[place.category as PlaceCategory] ?? place.category;

  return (
    <li ref={listItemRef} data-place-slug={place.slug}>
      <article
        className={cn(
          "flex gap-3 border-b border-gray-100 p-4 transition-colors last:border-b-0",
          selected ? "bg-brand-light/40 ring-1 ring-sky/20" : "hover:bg-gray-50/80"
        )}
      >
        <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 gap-3 text-left">
          {place.coverImage ? (
            <div className="relative h-[72px] w-[88px] shrink-0 overflow-hidden rounded-xl">
              <Image
                src={place.coverImage}
                alt=""
                fill
                className="object-cover"
                sizes="88px"
              />
            </div>
          ) : (
            <div className="flex h-[72px] w-[88px] shrink-0 items-center justify-center rounded-xl bg-sky/10 text-sky">
              <MapPin className="h-5 w-5" aria-hidden />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-charcoal">
              {place.name}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-slate">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{place.region}</span>
            </p>
            <p className="mt-1 text-xs text-slate">{category}</p>
          </div>
        </button>

        <div className="flex shrink-0 flex-col justify-end">
          <Link
            href={placeHref(place.slug)}
            className="text-xs font-medium text-brand hover:underline"
          >
            Подробнее
          </Link>
        </div>
      </article>
    </li>
  );
}
