import type { TourDetail } from "@/types";
import { buildTourProductJsonLd } from "@/lib/tour-json-ld";
import { serializeJsonLd } from "@/lib/schema-json-ld";

export default function TourJsonLd({
  tour,
  catalogPath = "/tours",
}: {
  tour: TourDetail;
  catalogPath?: "/tours" | "/excursions";
}) {
  const jsonLd = buildTourProductJsonLd(tour, undefined, catalogPath);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
    />
  );
}
