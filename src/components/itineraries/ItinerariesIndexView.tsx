import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import type { PlaceItinerary } from "@/types/place";
import { itineraryHref } from "@/lib/places-repository";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/cn";

export default function ItinerariesIndexView({
  itineraries,
}: {
  itineraries: PlaceItinerary[];
}) {
  return (
    <div className="pb-16">
      <section className="border-b border-gray-100 bg-gradient-to-b from-sky/[0.06] via-white to-white">
        <div className={cn(siteContainerClass, "py-8 sm:py-10")}>
          <h1 className="font-display text-3xl font-bold text-charcoal sm:text-4xl">Готовые маршруты</h1>
          <p className="mt-2 max-w-2xl text-base text-slate">
            Пошаговые планы поездок по Аргентине — от Patagonia до северо-запада и столицы.
          </p>
        </div>
      </section>

      <div className={cn(siteContainerClass, "mt-8 grid gap-6")}>
        {itineraries.map((it) => (
          <Link
            key={it.slug}
            href={itineraryHref(it.slug)}
            className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated sm:flex-row"
          >
            <div className="relative aspect-[16/9] shrink-0 sm:w-72 sm:aspect-auto">
              {it.coverImage ? (
                <Image src={it.coverImage} alt={it.title} fill className="object-cover" sizes="288px" />
              ) : (
                <div className="h-full min-h-[160px] bg-gray-100" />
              )}
            </div>
            <div className="flex flex-1 flex-col justify-center p-5 sm:p-6">
              <h2 className="font-heading text-xl font-bold text-charcoal group-hover:text-sky">{it.title}</h2>
              {it.subtitle ? <p className="mt-1 text-sm text-slate">{it.subtitle}</p> : null}
              <p className="mt-2 line-clamp-2 text-sm text-charcoal/80">{it.description}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                  {it.durationDays} дней
                </span>
                {it.season ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {it.season}
                  </span>
                ) : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
