import type { PlaceDetail } from "@/types/place";
import { buildPlaceProductJsonLd } from "@/lib/places-seo";

export default function PlaceJsonLd({ place }: { place: PlaceDetail }) {
  const jsonLd = buildPlaceProductJsonLd(place);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
