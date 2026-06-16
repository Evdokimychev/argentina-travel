import Image from "next/image";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { PlaceItinerary } from "@/types/place";
import { placeHref } from "@/lib/places-repository";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/cn";

export default function ItineraryDetailView({ itinerary }: { itinerary: PlaceItinerary }) {
  const days = [...new Set(itinerary.stops.map((s) => s.dayNumber))].sort((a, b) => a - b);

  return (
    <article className="pb-16">
      <div className="relative aspect-[21/9] min-h-[200px] w-full overflow-hidden bg-charcoal">
        {itinerary.coverImage ? (
          <Image
            src={itinerary.coverImage}
            alt={itinerary.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 to-charcoal/20" />
        <div className={cn(siteContainerClass, "relative flex h-full flex-col justify-end pb-8 pt-16")}>
          <Link href="/itineraries" className="text-sm text-white/70 hover:text-white">
            ← Все маршруты
          </Link>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">{itinerary.title}</h1>
          {itinerary.subtitle ? (
            <p className="mt-1 text-lg text-white/85">{itinerary.subtitle}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-white/80">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-4 w-4" aria-hidden />
              {itinerary.durationDays} дней
            </span>
            {itinerary.season ? <span>{itinerary.season}</span> : null}
            {itinerary.difficulty ? <span>Сложность: {itinerary.difficulty}</span> : null}
          </div>
        </div>
      </div>

      <div className={cn(siteContainerClass, "mt-8 max-w-3xl")}>
        <p className="text-base leading-relaxed text-charcoal">{itinerary.description}</p>

        <div className="mt-10 space-y-8">
          {days.map((day) => (
            <section key={day}>
              <h2 className="font-heading text-lg font-bold text-charcoal">День {day}</h2>
              <ol className="mt-3 space-y-4 border-l-2 border-sky/30 pl-5">
                {itinerary.stops
                  .filter((s) => s.dayNumber === day)
                  .map((stop) => (
                    <li key={stop.id} className="relative">
                      <span className="absolute -left-[calc(1.25rem+5px)] top-1.5 h-2.5 w-2.5 rounded-full bg-sky" />
                      <p className="font-medium text-charcoal">{stop.title}</p>
                      {stop.description ? (
                        <p className="mt-0.5 text-sm text-slate">{stop.description}</p>
                      ) : null}
                      {stop.place ? (
                        <Link
                          href={placeHref(stop.place.slug)}
                          className="mt-1 inline-block text-sm text-sky hover:underline"
                        >
                          {stop.place.name} →
                        </Link>
                      ) : null}
                    </li>
                  ))}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
