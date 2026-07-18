import type { PlaceDetail } from "@/types/place";
import { buildPlaceProductJsonLd } from "@/lib/places-seo";
import { serializeJsonLd } from "@/lib/schema-json-ld";

export default function PlaceJsonLd({ place }: { place: PlaceDetail }) {
  const jsonLd = buildPlaceProductJsonLd(place);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
    />
  );
}
