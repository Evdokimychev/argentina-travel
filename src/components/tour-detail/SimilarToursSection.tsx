import Image from "next/image";
import Link from "next/link";
import { TourDetail } from "@/types";
import TourPublicPriceDisplay from "./TourPublicPriceDisplay";
import { formatDurationShort } from "@/lib/pluralize";
import TourSection from "./TourSection";

export default function SimilarToursSection({ tours }: { tours: TourDetail[] }) {
  if (tours.length === 0) return null;

  return (
    <TourSection id="similar" title="Похожие путешествия">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tours.map((tour) => (
          <Link
            key={tour.slug}
            href={`/tours/${tour.slug}`}
            className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-lg"
          >
            <div className="relative h-44">
              <Image
                src={tour.image}
                alt={tour.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-charcoal group-hover:text-sky">
                {tour.title}
              </h3>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate">
                  {formatDurationShort(tour.durationDays, tour.durationNights)}
                </span>
                <TourPublicPriceDisplay
                  priceUsd={tour.priceUsd}
                  originalPriceUsd={tour.originalPriceUsd}
                  priceOnRequest={tour.priceOnRequest}
                  priceFromPrefix={tour.priceFromPrefix}
                  size="sm"
                  showFrom={false}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </TourSection>
  );
}
