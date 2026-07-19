"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PlaceDetailContentSections from "@/components/places/PlaceDetailContentSections";
import PageBreadcrumbs from "@/components/navigation/PageBreadcrumbs";
import PlaceFavoriteButton from "@/components/places/PlaceFavoriteButton";
import DetailPhotoGallery from "@/components/shared/DetailPhotoGallery";
import { favoriteHeaderButtonClass } from "@/lib/favorite-button-styles";
import PlaceTransportMapSection from "@/components/places/PlaceTransportMapSection";
import PlacePracticalSummary from "@/components/places/PlacePracticalSummary";
import RelatedPlacesSection from "@/components/places/RelatedPlacesSection";
import RelatedKnowledgeSection from "@/components/knowledge/RelatedKnowledgeSection";
import TourEmbedSection from "@/components/embed/TourEmbedSection";
import { getDestinationPageById } from "@/data/destination-pages";
import { PLACE_CATEGORY_LABELS } from "@/types/place";
import type { PlaceDetail } from "@/types/place";
import type { TourListing } from "@/types";
import { destinationHref } from "@/lib/destinations";
import { pairedDestinationIdForPlace } from "@/lib/geography-links";
import { resolveRelatedTourMatchesForPlace } from "@/lib/cms-content-cross-links";
import { useRepositoryTourListings } from "@/hooks/useRepositoryTourListings";
import { collectionHref, itineraryHref } from "@/lib/places-urls";
import { buildPlacesCatalogHref } from "@/lib/places-catalog-filters";
import { destinationIdForPlaceRegion } from "@/lib/places-nav";
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
  const tours = useRepositoryTourListings(initialTours);
  const tourMatches = resolveRelatedTourMatchesForPlace(place, tours);
  const matchedTours = tourMatches.map((match) => match.tour);
  const galleryAlts = getPlaceGalleryAlts(place.slug);
  const destinationId =
    pairedDestinationIdForPlace(place.slug) ?? destinationIdForPlaceRegion(place.region);
  const destinationPage = destinationId ? getDestinationPageById(destinationId) : undefined;
  const detailNavigation = [
    ["#place-planning", "План поездки"],
    ["#place-map", "Как добраться"],
    ...(place.gallery.length > 1 ? [["#place-gallery", "Фотографии"]] : []),
    ...(matchedTours.length > 0 ? [["#place-tours", "Туры рядом"]] : []),
    ["#place-nearby", "Что посмотреть рядом"],
  ];

  return (
    <article className="pb-16">
      <div className="relative aspect-[21/9] min-h-[320px] w-full overflow-hidden bg-charcoal sm:min-h-[360px]">
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
        <div className={cn(siteContainerClass, "relative flex h-full flex-col justify-end pb-6 pt-12 sm:pb-8 sm:pt-16")}>
          <PageBreadcrumbs
            variant="on-dark"
            separator="dash"
            className="mb-4"
            items={[
              { label: "Главная", href: "/" },
              { label: "Регионы и места", href: "/destinations" },
              { label: "Справочник", href: "/places" },
              { label: place.name },
            ]}
          />
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
              className={favoriteHeaderButtonClass}
              iconClassName="h-4 w-4"
            />
          </div>
        </div>
      </div>

      <div className={cn(siteContainerClass, "mt-8 grid gap-10 lg:grid-cols-[1fr_320px]")}>
        <div className="min-w-0 space-y-8">
          <nav
            aria-label="Разделы страницы"
            className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
          >
            {detailNavigation.map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-border-subtle bg-surface-elevated px-3 text-sm font-medium text-charcoal transition hover:border-sky/30 hover:text-sky-ink"
              >
                {label}
              </a>
            ))}
          </nav>

          <PlacePracticalSummary place={place} />

          <section className="prose prose-slate max-w-none">
            <p className="whitespace-pre-line text-base leading-relaxed text-charcoal">
              {place.fullDescription}
            </p>
          </section>

          {place.kbSlug ? (
            <Link
              href={`/baza-znaniy/${place.kbSlug}`}
              className="inline-flex items-center gap-2 rounded-button border border-sky/20 bg-sky/5 px-4 py-2 text-sm font-semibold text-sky-ink transition hover:bg-sky/10"
            >
              Подробный разбор в базе знаний →
            </Link>
          ) : null}

          <PlaceDetailContentSections place={place} />

          {place.gallery.length > 1 ? (
            <section id="place-gallery" className="scroll-mt-28">
              <h2 className="font-heading text-xl font-bold text-charcoal">Галерея</h2>
              <DetailPhotoGallery
                images={place.gallery}
                title={place.name}
                altForImage={(i) => galleryAlts[i] ?? `${place.name} — фото ${i + 1}`}
                className="mt-4 sm:grid-cols-2"
                placeholderVariant="generic"
              />
            </section>
          ) : null}

          <PlaceTransportMapSection place={place} relatedPlaces={place.relatedPlaces} />

          {matchedTours.length > 0 ? (
            <div id="place-tours" className="scroll-mt-28">
              <TourEmbedSection
                config={{
                  variant: "strip",
                  title: `Туры рядом с ${place.name}`,
                  subtitle: "Маршруты подобраны по месту и региону — логистика уже продумана",
                  limit: 6,
                  source: { kind: "slugs", slugs: matchedTours.map((t) => t.slug) },
                  catalogHref: `/tours?query=${encodeURIComponent(place.region)}`,
                  catalogLabel: "Все туры региона",
                  tone: "muted",
                  showMatchReasons: true,
                  matchReasons: Object.fromEntries(
                    tourMatches.map((match) => [match.tour.slug, match.reasons.join(". ")]),
                  ),
                }}
                initialTours={matchedTours}
              />
            </div>
          ) : null}

          <RelatedPlacesSection places={place.relatedPlaces} />

          {knowledgeLinks ? <RelatedKnowledgeSection links={knowledgeLinks} className="mt-8" /> : null}
        </div>

        <aside className="space-y-6">
          {destinationPage ? (
            <div className="rounded-card border border-sky/15 bg-gradient-to-br from-sky/5 to-surface-elevated p-5 shadow-card">
              <h2 className="font-heading text-lg font-bold text-charcoal">Регион для планирования</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate">
                Сезоны, логистика и туры по направлению «{destinationPage.name}» — в региональном гиде.
              </p>
              <Link
                href={destinationHref(destinationId!)}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-ink hover:underline"
              >
                Открыть гид региона
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          ) : (
            <div className="rounded-card border border-border-subtle bg-surface-muted/60 p-5">
              <h2 className="font-heading text-sm font-bold text-charcoal">Планирование поездки</h2>
              <p className="mt-2 text-sm text-slate">
                Региональные гиды с сезонами и турами — в обзоре направлений.
              </p>
              <Link href="/destinations" className="mt-3 inline-flex text-sm font-medium text-sky-ink hover:underline">
                Регионы и места
              </Link>
            </div>
          )}

          {place.tags.length > 0 ? (
            <div className="rounded-card border border-border-subtle bg-surface-elevated p-5 shadow-card">
              <h2 className="font-heading text-lg font-bold text-charcoal">Темы</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {place.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={buildPlacesCatalogHref({ tag })}
                    className="rounded-full bg-sky/10 px-3 py-1 text-xs font-medium text-sky-ink transition-colors hover:bg-sky/20"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {place.collections.length > 0 ? (
            <div className="rounded-card border border-border-subtle bg-surface-elevated p-5 shadow-card">
              <h2 className="font-heading text-lg font-bold text-charcoal">Подборки</h2>
              <ul className="mt-3 space-y-2">
                {place.collections.map((col) => (
                  <li key={col.slug}>
                    <Link href={collectionHref(col.slug)} className="text-sm text-sky-ink hover:underline">
                      {col.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {place.itineraryReferences.length > 0 ? (
            <div className="rounded-card border border-border-subtle bg-surface-elevated p-5 shadow-card">
              <h2 className="font-heading text-lg font-bold text-charcoal">Маршруты</h2>
              <ul className="mt-3 space-y-2">
                {place.itineraryReferences.map((it) => (
                  <li key={it.slug}>
                    <Link href={itineraryHref(it.slug)} className="text-sm text-sky-ink hover:underline">
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
