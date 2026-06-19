import PlaceCard from "@/components/places/PlaceCard";
import type { PlaceListing } from "@/types/place";

export default function RelatedPlacesSection({ places }: { places: PlaceListing[] }) {
  if (places.length === 0) return null;

  return (
    <section>
      <h2 className="font-heading text-xl font-bold text-charcoal">Похожие места</h2>
      <p className="mt-1 text-sm text-slate">Подобрано по региону, категории и темам</p>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {places.slice(0, 6).map((place) => (
          <PlaceCard key={place.slug} place={place} />
        ))}
      </div>
    </section>
  );
}
