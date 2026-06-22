"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { PlaceListing } from "@/types/place";
import { buildMapPlaceDeepLink } from "@/lib/map-argentina-url-state";

const PlaceDetailMap = dynamic(() => import("@/components/places/PlaceDetailMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[220px] items-center justify-center rounded-xl bg-gray-50 text-sm text-slate sm:h-[260px]">
      Загрузка карты…
    </div>
  ),
});

type Props = {
  place: Pick<PlaceListing, "id" | "name" | "slug" | "latitude" | "longitude" | "region"> & {
    howToGetThere?: string;
  };
  relatedPlaces: PlaceListing[];
};

export default function PlaceTransportMapSection({ place, relatedPlaces }: Props) {
  if (!place.howToGetThere && (place.latitude == null || place.longitude == null)) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-sky/15 bg-gradient-to-br from-sky/[0.04] to-white shadow-sm">
      <div className="border-b border-sky/10 px-5 py-4 sm:px-6">
        <h2 className="font-heading text-xl font-bold text-charcoal">Как добраться</h2>
        {place.howToGetThere ? (
          <p className="mt-2 text-base leading-relaxed text-charcoal">{place.howToGetThere}</p>
        ) : null}
      </div>
      <div className="p-4 sm:p-5">
        <PlaceDetailMap place={place} relatedPlaces={relatedPlaces} />
        <Link
          href={buildMapPlaceDeepLink({ id: place.id })}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-sky hover:underline"
        >
          <MapPin className="h-4 w-4" aria-hidden />
          Показать на карте Аргентины
        </Link>
      </div>
    </section>
  );
}
