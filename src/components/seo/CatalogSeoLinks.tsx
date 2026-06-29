import { formatTourCatalogSeoPriceLabel } from "@/lib/tour-price-public";
import type { TourListing } from "@/types";

export default function CatalogSeoLinks({ tours }: { tours: TourListing[] }) {
  if (tours.length === 0) return null;

  return (
    <nav aria-label="Каталог туров для поисковых систем" className="sr-only">
      <ul>
        {tours.map((tour) => (
          <li key={tour.id}>
            <a href={`/tours/${tour.slug}`}>
              {tour.title} — {tour.region},{" "}
              {formatTourCatalogSeoPriceLabel(tour)}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
