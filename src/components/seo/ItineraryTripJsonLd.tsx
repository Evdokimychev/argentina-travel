import type { PlaceItinerary } from "@/types/place";
import { buildItineraryTripJsonLd } from "@/lib/content-json-ld";
import { serializeJsonLd } from "@/lib/schema-json-ld";

export default function ItineraryTripJsonLd({ itinerary }: { itinerary: PlaceItinerary }) {
  const jsonLd = buildItineraryTripJsonLd(itinerary);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
    />
  );
}
