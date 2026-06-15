"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import MarketplaceTourCard from "@/components/marketplace/MarketplaceTourCard";
import { Button } from "@/components/ui/button";
import type { DestinationPage } from "@/data/destination-pages";
import { useRepositoryTourListings } from "@/hooks/useRepositoryTourListings";
import { destinationCatalogLink, matchToursForDestination } from "@/lib/destinations";
import { destinationExcursionsHref } from "@/data/excursion-city-links";
import { siteContainerClass } from "@/lib/site-container";
import type { TourListing } from "@/types";

interface DestinationDetailViewProps {
  destination: DestinationPage;
  initialTours: TourListing[];
}

export default function DestinationDetailView({
  destination,
  initialTours,
}: DestinationDetailViewProps) {
  const tours = useRepositoryTourListings(initialTours);
  const matchedTours = matchToursForDestination(tours, destination);
  const catalogHref = destinationCatalogLink(destination);
  const excursionsHref = destinationExcursionsHref(destination.id);

  return (
    <>
      <section className="relative min-h-[42vh] overflow-hidden">
        <Image
          src={destination.image}
          alt={destination.name}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/35 to-charcoal/10" />
        <div className={siteContainerClass + " relative flex min-h-[42vh] flex-col justify-end py-10"}>
          <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-white/75">
            <Link href="/" className="hover:text-white">
              Главная
            </Link>
            <span>–</span>
            <Link href="/destinations" className="hover:text-white">
              Направления
            </Link>
            <span>–</span>
            <span className="text-white">{destination.name}</span>
          </nav>
          <p className="flex items-center gap-1.5 text-sm text-white/80">
            <MapPin className="h-4 w-4" aria-hidden />
            {destination.region}
          </p>
          <h1 className="mt-2 max-w-3xl font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {destination.name}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-white/85 sm:text-lg">{destination.description}</p>
        </div>
      </section>

      <section className={siteContainerClass + " py-12 sm:py-16"}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div>
            <h2 className="font-heading text-2xl font-bold text-charcoal">О направлении</h2>
            <p className="mt-4 text-base leading-relaxed text-slate">{destination.intro}</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {destination.highlights.map((item) => (
                <li
                  key={item}
                  className="rounded-xl border border-gray-100 bg-surface-muted px-4 py-3 text-sm text-charcoal"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <aside className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
            {destination.bestSeason ? (
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-sky" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-charcoal">Лучший сезон</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate">{destination.bestSeason}</p>
                </div>
              </div>
            ) : null}
            <Link href={catalogHref} className="mt-5 block">
              <Button className="w-full">
                Все туры в каталоге
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {excursionsHref ? (
              <Link href={excursionsHref} className="mt-3 block">
                <Button variant="outline" className="w-full">
                  Экскурсии в городе
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : null}
          </aside>
        </div>
      </section>

      <section className="bg-surface-muted py-12 sm:py-16">
        <div className={siteContainerClass}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl font-bold text-charcoal sm:text-3xl">
                Туры в регионе
              </h2>
              <p className="mt-2 text-slate">
                {matchedTours.length > 0
                  ? `Найдено ${matchedTours.length} подходящих маршрутов`
                  : "Пока нет точных совпадений — откройте полный каталог"}
              </p>
            </div>
            <Link href={catalogHref} className="text-sm font-medium text-sky hover:underline">
              Смотреть все в каталоге →
            </Link>
          </div>

          {matchedTours.length > 0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {matchedTours.slice(0, 6).map((tour) => (
                <MarketplaceTourCard key={tour.id} tour={tour} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
              <p className="font-medium text-charcoal">Туры по этому направлению скоро появятся</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate">
                Откройте каталог с фильтром по региону или свяжитесь с нами — поможем подобрать маршрут.
              </p>
              <Link href={catalogHref} className="mt-6 inline-block">
                <Button variant="outline">Перейти в каталог</Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
