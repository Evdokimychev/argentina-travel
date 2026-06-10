import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import Hero from "@/components/Hero";
import type { DestinationPage } from "@/data/destination-pages";
import { destinationHref } from "@/lib/destinations";
import { siteContainerClass } from "@/lib/site-container";

interface DestinationsIndexViewProps {
  destinations: DestinationPage[];
}

export default function DestinationsIndexView({ destinations }: DestinationsIndexViewProps) {
  return (
    <>
      <Hero
        title="Направления Аргентины"
        subtitle="Регионы, города и природные чудеса — с турами от проверенных организаторов"
        image="https://images.unsplash.com/photo-1551632811-561732d1e306?w=1920&q=80"
        compact
      />

      <section className={siteContainerClass + " py-12 sm:py-16"}>
        <div className="max-w-2xl">
          <p className="text-base leading-relaxed text-slate">
            Выберите направление, чтобы узнать больше о регионе и сразу увидеть подходящие авторские
            туры. Каждая страница ведёт в каталог с готовым поисковым запросом.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {destinations.map((dest) => (
            <Link
              key={dest.id}
              href={destinationHref(dest.id)}
              className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-shadow hover:shadow-elevated"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={dest.image}
                  alt={dest.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/15 to-transparent" />
                <div className="absolute bottom-0 p-4 text-white">
                  <p className="flex items-center gap-1 text-xs text-white/75">
                    <MapPin className="h-3 w-3" aria-hidden />
                    {dest.region}
                  </p>
                  <h2 className="mt-1 font-display text-lg font-bold">{dest.name}</h2>
                  <p className="mt-1 line-clamp-2 text-xs text-white/85">{dest.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
