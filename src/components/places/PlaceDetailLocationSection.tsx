"use client";

import dynamic from "next/dynamic";
import type { PlaceListing } from "@/types/place";

const PlaceDetailMap = dynamic(() => import("@/components/places/PlaceDetailMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[280px] items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 text-sm text-slate sm:h-[320px]">
      Загрузка карты…
    </div>
  ),
});

type PlaceDetailLocationSectionProps = {
  place: Pick<PlaceListing, "name" | "slug" | "latitude" | "longitude" | "region">;
  relatedPlaces: PlaceListing[];
};

export default function PlaceDetailLocationSection({
  place,
  relatedPlaces,
}: PlaceDetailLocationSectionProps) {
  return (
    <section>
      <h2 className="font-heading text-xl font-bold text-charcoal">На карте</h2>
      <p className="mt-1 text-sm text-slate">{place.name} и ближайшие связанные места в регионе</p>
      <div className="mt-4">
        <PlaceDetailMap place={place} relatedPlaces={relatedPlaces} />
      </div>
    </section>
  );
}
