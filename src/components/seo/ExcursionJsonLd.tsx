import type { ExcursionDetail } from "@/types/excursion";
import { buildExcursionJsonLd } from "@/lib/excursion-json-ld";
import { serializeJsonLd } from "@/lib/schema-json-ld";

export default function ExcursionJsonLd({ excursion }: { excursion: ExcursionDetail }) {
  const jsonLd = buildExcursionJsonLd(excursion);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
    />
  );
}
