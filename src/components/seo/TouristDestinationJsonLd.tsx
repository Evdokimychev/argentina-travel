import type { DestinationPage } from "@/data/destination-pages";
import { buildDestinationTouristJsonLd } from "@/lib/content-json-ld";
import { serializeJsonLd } from "@/lib/schema-json-ld";

export default function TouristDestinationJsonLd({ destination }: { destination: DestinationPage }) {
  const jsonLd = buildDestinationTouristJsonLd(destination);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
    />
  );
}
