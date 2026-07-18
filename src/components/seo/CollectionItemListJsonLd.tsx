import type { PlaceCollection } from "@/types/place";
import { buildCollectionItemListJsonLd } from "@/lib/content-json-ld";
import { serializeJsonLd } from "@/lib/schema-json-ld";

export default function CollectionItemListJsonLd({ collection }: { collection: PlaceCollection }) {
  const jsonLd = buildCollectionItemListJsonLd(collection);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
    />
  );
}
