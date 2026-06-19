import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import type { PlaceCollection } from "@/types/place";
import { collectionHref } from "@/lib/places-repository";
import { cn } from "@/lib/cn";

type PlacesFeaturedCollectionsProps = {
  collections: PlaceCollection[];
  title: string;
  subtitle: string;
  viewAllLabel: string;
  className?: string;
};

export default function PlacesFeaturedCollections({
  collections,
  title,
  subtitle,
  viewAllLabel,
  className,
}: PlacesFeaturedCollectionsProps) {
  if (collections.length === 0) return null;

  return (
    <section className={cn("mb-8", className)} aria-label={title}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-sky" aria-hidden />
            <h2 className="font-heading text-lg font-bold text-charcoal">{title}</h2>
          </div>
          <p className="mt-1 text-sm text-slate">{subtitle}</p>
        </div>
        <Link
          href="/collections"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-sky hover:underline"
        >
          {viewAllLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-1">
        {collections.map((col) => (
          <Link
            key={col.slug}
            href={collectionHref(col.slug)}
            className="group relative w-[280px] shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated sm:w-[320px]"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              {col.coverImage ? (
                <Image
                  src={col.coverImage}
                  alt={col.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="320px"
                />
              ) : (
                <div className="h-full bg-gradient-to-br from-sky/20 to-gray-100" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/25 to-transparent" />
              <div className="absolute bottom-0 p-4 text-white">
                {col.subtitle ? (
                  <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">{col.subtitle}</p>
                ) : null}
                <h3 className="mt-1 font-heading text-lg font-bold leading-snug">{col.title}</h3>
                <p className="mt-2 line-clamp-2 text-xs text-white/80">{col.description}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-sky-200">
                  {col.places.length} мест
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
