import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, MapPin, Sparkles } from "lucide-react";
import Hero from "@/components/Hero";
import type { DestinationPage } from "@/data/destination-pages";
import { DESTINATION_REGION_GROUPS } from "@/data/destination-pages";
import { destinationHref } from "@/lib/destinations";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/utils";

interface DestinationsIndexViewProps {
  destinations: DestinationPage[];
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
        <Image
          src={dest.image}
          alt={dest.name}
          fill
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

export default function DestinationsIndexView({ destinations }: DestinationsIndexViewProps) {
  const featured = destinations.find((d) => d.id === "ba") ?? destinations[0];
  const rest = destinations.filter((d) => d.id !== featured.id);

  const grouped = DESTINATION_REGION_GROUPS.map((group) => ({
    label: group,
    items: rest.filter((d) => d.regionGroup === group),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <Hero
        eyebrow="8 направлений"
        title="Направления Аргентины"
        subtitle="От танго Буэнос-Айреса до ледников Патагонии — гиды, сезоны и туры от проверенных организаторов"
        image="https://images.unsplash.com/photo-1551632811-561732d1e306?w=1920&q=80"
        compact
      />

      <section className={cn(siteContainerClass, "py-12 sm:py-16")}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-base leading-relaxed text-slate">
              Каждая страница — подробный гид по региону: как добраться, когда ехать, что посмотреть и
              какие авторские туры уже доступны в каталоге.
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-4 rounded-2xl border border-gray-100 bg-surface-muted px-5 py-4 sm:gap-6 sm:px-6">
            <div>
              <dt className="text-xs text-slate">Направлений</dt>
              <dd className="font-heading text-2xl font-bold text-charcoal">{destinations.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate">Регионов</dt>
              <dd className="font-heading text-2xl font-bold text-charcoal">{DESTINATION_REGION_GROUPS.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate">Формат</dt>
              <dd className="font-heading text-lg font-bold text-charcoal">Туры + экскурсии</dd>
            </div>
          </dl>
        </div>

        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-bold text-charcoal">Рекомендуем начать с</h2>
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
              <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">{group.label}</h2>
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
    </>
  );
}
