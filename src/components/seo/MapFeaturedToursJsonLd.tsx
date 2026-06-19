import type { MapTourPoint } from "@/lib/map-types";
import { buildMapFeaturedToursItemListJsonLd } from "@/lib/map-json-ld";

export default function MapFeaturedToursJsonLd({ tours }: { tours: MapTourPoint[] }) {
  if (tours.length === 0) return null;

  const jsonLd = buildMapFeaturedToursItemListJsonLd(tours);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
