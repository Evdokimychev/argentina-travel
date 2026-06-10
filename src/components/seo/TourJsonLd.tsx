import type { TourDetail } from "@/types";
import { buildTourProductJsonLd } from "@/lib/tour-json-ld";

export default function TourJsonLd({ tour }: { tour: TourDetail }) {
  const jsonLd = buildTourProductJsonLd(tour);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
