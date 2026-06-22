import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { destinationHref } from "@/lib/destinations";
import { cn } from "@/lib/cn";
import type { Destination } from "@/types";

type BlogDestinationGalleryProps = {
  destinations: Destination[];
  className?: string;
};

export default function BlogDestinationGallery({
  destinations,
  className,
}: BlogDestinationGalleryProps) {
  if (destinations.length === 0) return null;

  return (
    <section
      className={cn(className)}
      aria-labelledby="blog-destination-gallery-title"
    >
      <h2
        id="blog-destination-gallery-title"
        className="font-heading text-lg font-bold text-charcoal sm:text-xl"
      >
        Направления в материале
      </h2>
      <p className="mt-1 text-sm text-slate">
        Справочник регионов и подборки туров по теме статьи
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {destinations.map((dest) => (
          <li key={dest.id}>
            <Link
              href={destinationHref(dest.id)}
              className="group flex overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-all hover:-translate-y-0.5 hover:border-sky/25 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <div className="relative aspect-[3/2] w-28 shrink-0 sm:w-32">
                <SafeImage
                  src={dest.image}
                  alt={dest.imageAlt ?? dest.name}
                  fill
                  className="object-cover"
                  sizes="128px"
                  loading="lazy"
                  placeholderVariant="destination"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center p-3 sm:p-4">
                <span className="inline-flex items-center gap-1 text-2xs font-semibold uppercase tracking-wider text-sky">
                  <MapPin className="h-3 w-3" aria-hidden />
                  {dest.region}
                </span>
                <span className="mt-1 font-heading text-sm font-bold text-charcoal group-hover:text-sky sm:text-base">
                  {dest.name}
                </span>
                <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate">
                  {dest.description}
                </span>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-sky">
                  Справочник
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        <Link href="/destinations" className="font-semibold text-sky hover:underline">
          Все направления →
        </Link>
        {destinations[0] ? (
          <Link
            href={`/tours?query=${encodeURIComponent(destinations[0].name)}`}
            className="font-semibold text-sky hover:underline"
          >
            Туры: {destinations[0].name}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
