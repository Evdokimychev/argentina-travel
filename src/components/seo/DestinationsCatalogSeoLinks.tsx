import type { DestinationPage } from "@/data/destination-pages";
import type { PlaceListing } from "@/types/place";
import { destinationHref } from "@/lib/destinations";
import { placeHref } from "@/lib/places-repository";

const TOP_PLACES_LIMIT = 20;

type Props = {
  destinations: DestinationPage[];
  places?: PlaceListing[];
};

export default function DestinationsCatalogSeoLinks({ destinations, places = [] }: Props) {
  if (destinations.length === 0 && places.length === 0) return null;

  const topPlaces = places.slice(0, TOP_PLACES_LIMIT);

  return (
    <nav aria-label="Каталог регионов для поисковых систем" className="sr-only">
      <ul>
        {destinations.map((destination) => (
          <li key={destination.id}>
            <a href={destinationHref(destination.id)}>
              {destination.name} — {destination.region}
            </a>
          </li>
        ))}
        {topPlaces.map((place) => (
          <li key={`place-${place.id}`}>
            <a href={placeHref(place.slug)}>
              {place.name} — {place.region}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
