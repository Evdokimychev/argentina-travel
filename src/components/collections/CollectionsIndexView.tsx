import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PlaceCollection } from "@/types/place";
import { collectionHref } from "@/lib/places-repository";
import { formatSpots } from "@/lib/pluralize";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/cn";

export default function CollectionsIndexView({
  collections,
}: {
  collections: PlaceCollection[];
}) {
  return (
    <div className="pb-16">
      <section className="border-b border-gray-100 bg-gradient-to-b from-sky/[0.06] via-white to-white">
        <div className={cn(siteContainerClass, "py-8 sm:py-10")}>
          <h1 className="font-display text-3xl font-bold text-charcoal sm:text-4xl">Подборки мест</h1>
          <p className="mt-2 max-w-2xl text-base text-slate">
            Тематические коллекции для планирования поездки: Patagonia, северо-запад, UNESCO и другие.
          </p>
        </div>
      </section>

      <div className={cn(siteContainerClass, "mt-8 grid gap-6 sm:grid-cols-2")}>
        {collections.map((col) => (
          <Link
            key={col.slug}
            href={collectionHref(col.slug)}
            className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated"
          >
            <div className="relative aspect-[16/9] overflow-hidden">
              {col.coverImage ? (
                <Image
                  src={col.coverImage}
                  alt={col.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="50vw"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent" />
              <div className="absolute bottom-0 p-5 text-white">
                <h2 className="font-heading text-xl font-bold">{col.title}</h2>
                {col.subtitle ? <p className="mt-1 text-sm text-white/85">{col.subtitle}</p> : null}
                <p className="mt-2 line-clamp-2 text-xs text-white/75">{col.description}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-sky-200">
                  {formatSpots(col.places.length)}
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
