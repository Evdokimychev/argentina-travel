import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Layers, MapPin } from "lucide-react";
import Hero from "@/components/Hero";
import SectionShell from "@/components/layout/SectionShell";
import type { PlaceCollection } from "@/types/place";
import { collectionHref } from "@/lib/places-repository";
import { formatSpots } from "@/lib/pluralize";
import { getServicePageHeroImage } from "@/lib/media-resolver";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/cn";

function CollectionCard({ col }: { col: PlaceCollection }) {
  return (
    <Link
      href={collectionHref(col.slug)}
      className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated motion-reduce:transform-none"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {col.coverImage ? (
          <Image
            src={col.coverImage}
            alt={col.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transform-none"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="h-full bg-gradient-to-br from-sky/20 to-gray-100" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/25 to-transparent" />
        <div className="absolute left-4 top-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-white backdrop-blur-sm">
            <Layers className="h-3 w-3" aria-hidden />
            Подборка
          </span>
        </div>
        <div className="absolute bottom-0 p-4 text-white sm:p-5">
          {col.subtitle ? (
            <p className="flex items-center gap-1 text-xs text-white/75">
              <MapPin className="h-3 w-3" aria-hidden />
              {col.subtitle}
            </p>
          ) : null}
          <h2 className="mt-1 font-heading text-lg font-bold sm:text-xl">{col.title}</h2>
          <p className="mt-1 line-clamp-2 text-xs text-white/85 sm:text-sm">{col.description}</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-sky-200">
            {formatSpots(col.places.length)}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function CollectionsIndexView({
  collections,
}: {
  collections: PlaceCollection[];
}) {
  return (
    <>
      <Hero
        eyebrow="Места и маршруты"
        title="Подборки мест"
        subtitle="Тематические коллекции для планирования поездки: Патагония, UNESCO, винный маршрут и другие готовые списки."
        image={getServicePageHeroImage("places")}
        compact
      />

      <section className={cn(siteContainerClass, "py-10 sm:py-12")}>
        <p className="max-w-2xl text-base leading-relaxed text-slate">
          Каждая подборка — отобранные места с картой, практическими советами и ссылками на туры по
          региону. Начните с темы, которая совпадает с вашим маршрутом.
        </p>

        <dl className="mt-8 grid grid-cols-2 gap-4 rounded-2xl border border-gray-100 bg-surface-muted px-5 py-4 sm:grid-cols-3 sm:gap-6 sm:px-6">
          <div>
            <dt className="text-xs text-slate">Подборок</dt>
            <dd className="font-heading text-2xl font-bold text-charcoal">{collections.length}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate">Мест в каталоге</dt>
            <dd className="font-heading text-2xl font-bold text-charcoal">
              {collections.reduce((sum, col) => sum + col.places.length, 0)}
            </dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-xs text-slate">Формат</dt>
            <dd className="font-heading text-lg font-bold text-charcoal">Карта + туры</dd>
          </div>
        </dl>
      </section>

      <SectionShell
        eyebrow="Коллекции"
        title="Выберите тему"
        subtitle="От ледников Патагонии до северо-запада и винных долин — готовые списки мест с практическими деталями."
        className={siteContainerClass}
      >
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col) => (
            <CollectionCard key={col.slug} col={col} />
          ))}
        </div>
      </SectionShell>
    </>
  );
}
