import Image from "next/image";
import Link from "next/link";
import { TourDetail } from "@/types";
import TourPublicPriceDisplay from "./TourPublicPriceDisplay";
import { formatDurationShort } from "@/lib/pluralize";
import TourSection from "./TourSection";
import { cn } from "@/lib/cn";
import { tourCardShellClass, tourCardShellInteractiveClass } from "@/lib/tour-card-shell";
import TourCardImageVignette from "@/components/marketplace/TourCardImageVignette";

export default function SimilarToursSection({ tours }: { tours: TourDetail[] }) {
  if (tours.length === 0) return null;

  return (
    <TourSection id="similar" title="Похожие путешествия">
      <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tours.map((tour) => (
          <Link
            key={tour.slug}
            href={`/tours/${tour.slug}`}
            className={cn(
              "group flex h-full flex-col",
              tourCardShellClass,
              tourCardShellInteractiveClass,
              "hover:border-sky/20"
            )}
          >
            <div className="relative aspect-[4/3] shrink-0 overflow-hidden">
              <Image
                src={tour.image}
                alt={tour.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <TourCardImageVignette />
            </div>

            <div className="flex min-h-[8.5rem] flex-1 flex-col p-4">
              <h3 className="line-clamp-2 font-heading text-base font-bold leading-snug text-charcoal group-hover:text-sky">
                {tour.title}
              </h3>

              {tour.region ? (
                <p className="mt-1.5 line-clamp-1 text-xs text-slate">{tour.region}</p>
              ) : tour.shortDescription ? (
                <p className="mt-1.5 line-clamp-1 text-xs text-slate">{tour.shortDescription}</p>
              ) : null}

              <div className="mt-auto space-y-1.5 border-t border-gray-100 pt-3">
                <p className="text-xs text-slate">
                  {formatDurationShort(tour.durationDays, tour.durationNights)}
                </p>
                <TourPublicPriceDisplay
                  priceUsd={tour.priceUsd}
                  originalPriceUsd={tour.originalPriceUsd}
                  priceOnRequest={tour.priceOnRequest}
                  priceFromPrefix={tour.priceFromPrefix}
                  size="sm"
                  showFrom={false}
                  showDiscountRibbon={false}
                  density="compact"
                  className="[&_.font-bold]:text-base [&_.line-through]:text-[11px]"
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </TourSection>
  );
}
