import type { MapTourPoint } from "@/lib/map-types";
import { absoluteUrl } from "@/lib/site-url";

export function buildMapFeaturedToursItemListJsonLd(tours: MapTourPoint[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Рекомендуемые туры на карте Аргентины",
    itemListElement: tours.map((tour, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/tours/${tour.slug}`),
      name: tour.title,
    })),
  };
}
