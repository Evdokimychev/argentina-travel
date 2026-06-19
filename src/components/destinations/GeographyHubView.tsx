import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  Map,
  MapPin,
  Mountain,
  Route,
  Sparkles,
} from "lucide-react";
import Hero from "@/components/Hero";
import PlaceCard from "@/components/places/PlaceCard";
import PlacesFeaturedCollections from "@/components/places/PlacesFeaturedCollections";
import { SafeImage } from "@/components/ui/safe-image";
import type { DestinationPage } from "@/data/destination-pages";
import { DESTINATION_REGION_GROUPS } from "@/data/destination-pages";
import { destinationHref } from "@/lib/destinations";
import { destinationHeroAlt } from "@/lib/media-alt-text";
import { siteContainerClass } from "@/lib/site-container";
import type { PlaceCollection, PlaceListing } from "@/types/place";
import { cn } from "@/lib/utils";

interface GeographyHubViewProps {
  destinations: DestinationPage[];
  places: PlaceListing[];
  collections?: PlaceCollection[];
}

function DestinationCard({
  dest,
  featured = false,
}: {
  dest: DestinationPage;
  featured?: boolean;
}) {
  return (
    <Link
      href={destinationHref(dest.id)}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated",
        featured && "sm:col-span-2 xl:col-span-2",
      )}
    >
      <div className={cn("relative overflow-hidden", featured ? "aspect-[21/9] sm:aspect-[2.4/1]" : "aspect-[4/3]")}>
        <SafeImage
          src={dest.image}
          alt={destinationHeroAlt(dest.name)}
          fill
          placeholderVariant="destination"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes={featured ? "(max-width: 1280px) 100vw, 50vw" : "(max-width: 768px) 100vw, 25vw"}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/25 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-white backdrop-blur-sm">
            {dest.regionGroup}
          </span>
          {featured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky/90 px-2.5 py-1 text-[11px] font-medium text-white">
              <Sparkles className="h-3 w-3" aria-hidden />
              Популярное
            </span>
          ) : null}
        </div>
        <div className={cn("absolute bottom-0 p-4 text-white sm:p-5", featured && "sm:p-6")}>
          <p className="flex items-center gap-1 text-xs text-white/75">
            <MapPin className="h-3 w-3" aria-hidden />
            {dest.region}
          </p>
          <h2 className={cn("mt-1 font-heading font-bold", featured ? "text-2xl sm:text-3xl" : "text-lg")}>
            {dest.name}
          </h2>
          <p className={cn("mt-1 text-white/85", featured ? "line-clamp-2 text-sm sm:max-w-xl" : "line-clamp-2 text-xs")}>
            {dest.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-white/80">
            <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 backdrop-blur-sm">
              <Clock className="h-3 w-3" aria-hidden />
              {dest.idealDuration}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 backdrop-blur-sm">
              <CalendarDays className="h-3 w-3" aria-hidden />
              {dest.bestSeason.split(";")[0]}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ConceptCard({
  icon: Icon,
  title,
  description,
  href,
  cta,
}: {
  icon: typeof MapPin;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-sky/10 text-sky">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <h2 className="mt-4 font-heading text-lg font-bold text-charcoal">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate">{description}</p>
      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sky hover:underline"
      >
        {cta}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}

export default function GeographyHubView({ destinations, places, collections = [] }: GeographyHubViewProps) {
  const featured = destinations.find((d) => d.id === "ba") ?? destinations[0];
  const rest = destinations.filter((d) => d.id !== featured.id);
  const topPlaces = places.slice(0, 8);
  const placesTotal = places.length;

  const grouped = DESTINATION_REGION_GROUPS.map((group) => ({
    label: group,
    items: rest.filter((d) => d.regionGroup === group),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <Hero
        eyebrow="Регионы и места"
        title="Куда поехать в Аргентине"
        subtitle="Регионы — для планирования поездки: сезоны, логистика и туры. Места — справочник парков, городов и достопримечательностей с картой и подборками."
        image="https://images.unsplash.com/photo-1551632811-561732d1e306?w=1920&q=80"
        compact
      />

      <section className={cn(siteContainerClass, "py-12 sm:py-16")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <ConceptCard
            icon={MapPin}
            title="Регионы для поездки"
            description="8 направлений с подробными гидами: как добраться, когда ехать, что посмотреть и какие туры уже есть в каталоге."
            href="/destinations#regions"
            cta="Смотреть регионы"
          />
          <ConceptCard
            icon={Mountain}
            title="Справочник мест"
            description={`${placesTotal} мест — парки, ледники, водопады и города. Фильтры, карта, подборки и готовые маршруты.`}
            href="/places"
            cta="Открыть справочник"
          />
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-4 rounded-2xl border border-gray-100 bg-surface-muted px-5 py-4 sm:grid-cols-4 sm:gap-6 sm:px-6">
          <div>
            <dt className="text-xs text-slate">Регионов</dt>
            <dd className="font-heading text-2xl font-bold text-charcoal">{destinations.length}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate">Мест в справочнике</dt>
            <dd className="font-heading text-2xl font-bold text-charcoal">{placesTotal}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate">Подборок</dt>
            <dd className="font-heading text-2xl font-bold text-charcoal">{collections.length || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate">Формат</dt>
            <dd className="font-heading text-lg font-bold text-charcoal">Гиды + карта</dd>
          </div>
        </dl>
      </section>

      <section id="regions" className={cn(siteContainerClass, "pb-12 sm:pb-16")}>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl font-bold text-charcoal sm:text-3xl">Регионы</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate">
              Выберите направление — на странице региона найдёте практический гид и ссылки на связанные места.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-heading text-lg font-bold text-charcoal">Рекомендуем начать с</h3>
            <Link
              href={destinationHref(featured.id)}
              className="inline-flex items-center gap-1 text-sm font-medium text-sky hover:underline"
            >
              Подробнее
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <DestinationCard dest={featured} featured />
          </div>
        </div>

        {grouped.map((group) => (
          <div key={group.label} className="mt-14">
            <div className="mb-5 flex items-center gap-3">
              <h3 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">{group.label}</h3>
              <span className="h-px flex-1 bg-gray-100" aria-hidden />
              <span className="text-sm text-slate">{group.items.length}</span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {group.items.map((dest) => (
                <DestinationCard key={dest.id} dest={dest} />
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="border-y border-gray-100 bg-surface-muted/50 py-12 sm:py-16">
        <div className={siteContainerClass}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl font-bold text-charcoal sm:text-3xl">Популярные места</h2>
              <p className="mt-1 max-w-2xl text-sm text-slate">
                Конкретные точки на карте — парки, ледники, города. Полный справочник с фильтрами и картой — на отдельной странице.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/places"
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-charcoal hover:border-sky hover:text-sky"
              >
                Все места
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/places?view=map"
                className="inline-flex items-center gap-1.5 rounded-full border border-sky/30 bg-sky/5 px-4 py-2 text-sm font-medium text-sky hover:bg-sky/10"
              >
                <Map className="h-4 w-4" aria-hidden />
                Карта
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {topPlaces.map((place) => (
              <PlaceCard key={place.slug} place={place} />
            ))}
          </div>
        </div>
      </section>

      {collections.length > 0 ? (
        <section className={cn(siteContainerClass, "py-12 sm:py-16")}>
          <PlacesFeaturedCollections
            collections={collections.slice(0, 4)}
            title="Готовые подборки"
            subtitle="Тематические маршруты по местам — от ледников Патагонии до северо-запада"
            viewAllLabel="Все подборки"
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/itineraries"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-charcoal hover:border-sky hover:text-sky"
            >
              <Route className="h-4 w-4" aria-hidden />
              Готовые маршруты
            </Link>
          </div>
        </section>
      ) : null}
    </>
  );
}