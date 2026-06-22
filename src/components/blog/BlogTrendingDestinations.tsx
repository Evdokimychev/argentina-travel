import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { POPULAR_DESTINATIONS } from "@/data/filters";
import { destinationHref } from "@/lib/destinations";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/cn";

const FEATURED = POPULAR_DESTINATIONS.slice(0, 6);

type BlogTrendingDestinationsProps = {
  className?: string;
};

export default function BlogTrendingDestinations({ className }: BlogTrendingDestinationsProps) {
  return (
    <section className={cn(className)} aria-labelledby="blog-trending-destinations-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="blog-trending-destinations-title"
            className="font-heading text-xl font-bold text-charcoal sm:text-2xl"
          >
            Популярные направления
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate">
            Регионы, о которых читают чаще всего — справочник и туры
          </p>
        </div>
        <Link
          href="/destinations"
          className="inline-flex items-center gap-1 text-sm font-semibold text-sky hover:underline"
        >
          Все направления
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURED.map((dest) => (
          <li key={dest.id}>
            <Link
              href={destinationHref(dest.id)}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-all hover:-translate-y-0.5 hover:border-sky/25 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <div className="relative aspect-[3/2]">
                <SafeImage
                  src={dest.image}
                  alt={dest.imageAlt ?? dest.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none"
                  sizes="(max-width: 640px) 100vw, 33vw"
                  loading="lazy"
                  placeholderVariant="destination"
                />
                <span className="absolute left-3 top-3 rounded-full border border-white/30 bg-white/90 px-2.5 py-1 text-2xs font-semibold text-charcoal backdrop-blur-sm">
                  {dest.region}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <span className="inline-flex items-center gap-1 font-heading text-base font-bold text-charcoal group-hover:text-sky">
                  <MapPin className="h-4 w-4 text-sky/70" aria-hidden />
                  {dest.name}
                </span>
                <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-slate">
                  {dest.description}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sky">
                  Туры и справочник
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        {FEATURED.slice(0, 4).map((dest) => (
          <Link
            key={`tours-${dest.id}`}
            href={`/tours?query=${encodeURIComponent(dest.name)}`}
            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-slate transition-colors hover:border-sky/30 hover:text-sky"
          >
            Туры: {dest.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
