import Link from "next/link";
import PlaceCard from "@/components/places/PlaceCard";
import TourSection from "./TourSection";
import type { PlaceListing } from "@/types/place";

export default function TourRelatedPlacesSection({ places }: { places: PlaceListing[] }) {
  if (places.length === 0) return null;

  return (
    <TourSection
      id="related-places"
      title="Места рядом с маршрутом"
      subtitle="Карточки из справочника — удобно спланировать поездку до или после тура"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {places.map((place) => (
          <PlaceCard key={place.slug} place={place} />
        ))}
      </div>
      <p className="mt-4 text-sm text-slate">
        <Link href="/places" className="font-medium text-sky hover:underline">
          Подробнее в справочнике мест
        </Link>
      </p>
    </TourSection>
  );
}
