import { placeHref } from "@/lib/places-repository";
import type { PlaceListing } from "@/types/place";

export default function PlacesCatalogSeoLinks({ places }: { places: PlaceListing[] }) {
  if (places.length === 0) return null;

  return (
    <nav aria-label="Каталог мест для поисковых систем" className="sr-only">
      <ul>
        {places.map((place) => (
          <li key={place.id}>
            <a href={placeHref(place.slug)}>
              {place.name} — {place.region}
              {place.category ? `, ${place.category}` : ""}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
