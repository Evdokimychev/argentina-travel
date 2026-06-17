import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Clock,
  ExternalLink,
  MapPin,
  Star,
  Ticket,
} from "lucide-react";
import PlaceDetailContentSections from "@/components/places/PlaceDetailContentSections";
import PlaceFavoriteButton from "@/components/places/PlaceFavoriteButton";
import PlaceDetailLocationSection from "@/components/places/PlaceDetailLocationSection";
import RelatedPlacesSection from "@/components/places/RelatedPlacesSection";
import RelatedKnowledgeSection from "@/components/knowledge/RelatedKnowledgeSection";
import TourEmbedSection from "@/components/embed/TourEmbedSection";
import { PLACE_CATEGORY_LABELS } from "@/types/place";
import type { PlaceDetail } from "@/types/place";
import type { TourListing } from "@/types";
import { collectionHref, itineraryHref } from "@/lib/places-repository";
import { buildPlacesCatalogHref } from "@/lib/places-catalog-filters";
import type { KnowledgeLinksBundle } from "@/lib/knowledge-internal-links";
import { getPlaceCoverAlt, getPlaceGalleryAlts } from "@/lib/media-resolver";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/cn";

export default function PlaceDetailView({
  place,
  knowledgeLinks,
  initialTours = [],
}: {
  place: PlaceDetail;
  knowledgeLinks?: KnowledgeLinksBundle;
  initialTours?: TourListing[];
}) {
  const galleryAlts = getPlaceGalleryAlts(place.slug);
  return (
    <article className="pb-16">
      <div className="relative aspect-[21/9] min-h-[240px] w-full overflow-hidden bg-charcoal sm:min-h-[320px]">
        {place.coverImage ? (
          <Image
            src={place.coverImage}
            alt={getPlaceCoverAlt(place.slug)}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/30 to-charcoal/10" />
        <div className={cn(siteContainerClass, "relative flex h-full flex-col justify-end pb-8 pt-16")}>
          <span className="inline-flex w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white backdrop-blur-sm">
            {PLACE_CATEGORY_LABELS[place.category]}
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {place.name}
          </h1>
          <p className="mt-2 max-w-2xl text-base text-white/85 sm:text-lg">{place.shortDescription}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <PlaceFavoriteButton
              place={place}
              className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-charcoal shadow-sm backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      <div className={cn(siteContainerClass, "mt-8 grid gap-10 lg:grid-cols-[1fr_320px]")}>
        <div className="min-w-0 space-y-8">
          <section className="prose prose-slate max-w-none">
            <p className="whitespace-pre-line text-base leading-relaxed text-charcoal">
              {place.fullDescription}
            </p>
          </section>

          <PlaceDetailContentSections place={place} />

          {place.gallery.length > 1 ? (
            <section>
              <h2 className="font-heading text-xl font-bold text-charcoal">Галерея</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {place.gallery.map((src, i) => (
                  <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-xl">
                    <Image src={src} alt={galleryAlts[i] ?? `${place.name} — фото ${i + 1}`} fill className="object-cover" sizes="50vw" />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <PlaceDetailLocationSection place={place} relatedPlaces={place.relatedPlaces} />

          {initialTours.length > 0 ? (
            <TourEmbedSection
              config={{
                variant: "compact-list",
                title: `Туры рядом с ${place.name}`,
                subtitle: "Проверенные маршруты с гидом — логистика уже продумана",
                limit: 3,
                source: { kind: "query", query: place.name.split(/\s+/)[0] },
                catalogHref: `/tours?query=${encodeURIComponent(place.region)}`,
                catalogLabel: "Все туры региона",
                tone: "muted",
              }}
              initialTours={initialTours}
            />
          ) : null}

          <RelatedPlacesSection places={place.relatedPlaces} />

          {knowledgeLinks ? <RelatedKnowledgeSection links={knowledgeLinks} className="mt-8" /> : null}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
            <h2 className="font-heading text-lg font-bold text-charcoal">Практическая информация</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />
                <div>
                  <dt className="text-slate">Регион</dt>
                  <dd className="font-medium text-charcoal">{place.region}</dd>
                  {place.province ? (
                    <dd className="text-slate">{place.province}</dd>
                  ) : null}
                </div>
              </div>
              {place.visitDuration ? (
                <div className="flex gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />
                  <div>
                    <dt className="text-slate">Время посещения</dt>
                    <dd className="font-medium text-charcoal">{place.visitDuration}</dd>
                  </div>
                </div>
              ) : null}
              {place.season ? (
                <div className="flex gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />
                  <div>
                    <dt className="text-slate">Лучший сезон</dt>
                    <dd className="font-medium text-charcoal">{place.season}</dd>
                  </div>
                </div>
              ) : null}
              {place.ticketPrice ? (
                <div className="flex gap-3">
                  <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />
                  <div>
                    <dt className="text-slate">Стоимость</dt>
                    <dd className="font-medium text-charcoal">{place.ticketPrice}</dd>
                  </div>
                </div>
              ) : null}
              {place.rating != null ? (
                <div className="flex gap-3">
                  <Star className="mt-0.5 h-4 w-4 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
                  <div>
                    <dt className="text-slate">Рейтинг</dt>
                    <dd className="font-medium text-charcoal">{place.rating.toFixed(1)} / 5</dd>
                  </div>
                </div>
              ) : null}
            </dl>

            {place.website ? (
              <a
                href={place.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-sky hover:underline"
              >
                Официальный сайт
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            ) : null}
          </div>

          {place.tags.length > 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
              <h2 className="font-heading text-lg font-bold text-charcoal">Темы</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {place.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={buildPlacesCatalogHref({ tag })}
                    className="rounded-full bg-sky/10 px-3 py-1 text-xs font-medium text-sky transition-colors hover:bg-sky/20"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {place.collections.length > 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
              <h2 className="font-heading text-lg font-bold text-charcoal">Подборки</h2>
              <ul className="mt-3 space-y-2">
                {place.collections.map((col) => (
                  <li key={col.slug}>
                    <Link href={collectionHref(col.slug)} className="text-sm text-sky hover:underline">
                      {col.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {place.itineraryReferences.length > 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
              <h2 className="font-heading text-lg font-bold text-charcoal">Маршруты</h2>
              <ul className="mt-3 space-y-2">
                {place.itineraryReferences.map((it) => (
                  <li key={it.slug}>
                    <Link href={itineraryHref(it.slug)} className="text-sm text-sky hover:underline">
                      {it.title} ({it.durationDays} дн.)
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </article>
  );
}
