"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Lightbulb,
  MapPin,
  Plane,
} from "lucide-react";
import ContentReadingLayout from "@/components/content/ContentReadingLayout";
import PageBreadcrumbs from "@/components/navigation/PageBreadcrumbs";
import SharePageLinkButton from "@/components/content/SharePageLinkButton";
import DestinationInsuranceTeaser from "@/components/destinations/DestinationInsuranceTeaser";
import HubQuickFactsGrid from "@/components/guide/hub/HubQuickFactsGrid";
import { PageSlotImage } from "@/components/media/ContentSectionImage";
import RelatedContentCards from "@/components/content/RelatedContentCards";
import DetailPhotoGallery from "@/components/shared/DetailPhotoGallery";
import TourEmbedSection from "@/components/embed/TourEmbedSection";
import { SafeImage } from "@/components/ui/safe-image";
import { Button } from "@/components/ui/button";
import type { DestinationPage } from "@/data/destination-pages";
import { destinationGalleryAlt, destinationHeroAlt } from "@/lib/media-alt-text";
import { getPlaceBySlug } from "@/data/places-seed";
import { destinationExcursionsHref } from "@/data/excursion-city-links";
import { resolveDestinationEditorialTheme } from "@/lib/editorial-theme";
import { useRepositoryTourListings } from "@/hooks/useRepositoryTourListings";
import { destinationCatalogLink, matchToursForDestination } from "@/lib/destinations";
import { resolveDestinationTaxonomy } from "@/lib/destination-taxonomy";
import { flattenKnowledgeLinks } from "@/lib/content-related-links";
import { pairedPlaceSlugForDestination, placeSlugsForDestination } from "@/lib/geography-links";
import type { KnowledgeLinksBundle } from "@/lib/knowledge-internal-links";
import { placeHref } from "@/lib/places-urls";
import { siteContainerClass, siteScrollAnchorClass } from "@/lib/site-container";
import { cn } from "@/lib/utils";
import type { ContentTocItem } from "@/types/content-reading";
import type { TourListing } from "@/types";

interface DestinationDetailViewProps {
  destination: DestinationPage;
  initialTours: TourListing[];
  knowledgeLinks?: KnowledgeLinksBundle;
  flightSidebar?: React.ReactNode;
}

function buildDestinationQuickFacts(destination: DestinationPage) {
  return [
    {
      emoji: "🗓",
      label: "Срок",
      headline: destination.idealDuration,
      detail: "Оптимальная длительность поездки по этому направлению",
    },
    {
      emoji: "☀️",
      label: "Сезон",
      headline: destination.bestSeason.split(";")[0]?.trim() ?? destination.bestSeason,
      detail: destination.bestSeason.includes(";")
        ? destination.bestSeason.split(";").slice(1).join(";").trim()
        : undefined,
    },
    {
      emoji: "✈️",
      label: "Логистика",
      headline: "Как добраться",
      detail: "Авиа, наземный транспорт и переезды — в разделе ниже",
    },
  ];
}

function buildDestinationTocItems(destination: DestinationPage): ContentTocItem[] {
  const items: ContentTocItem[] = [
    { id: "about", label: "О направлении", level: 2 },
    { id: "highlights", label: "Главное в направлении", level: 2 },
  ];

  if (destination.gallery && destination.gallery.length > 1) {
    items.push({ id: "gallery", label: "Галерея", level: 2 });
  }

  items.push({ id: "how-to-get", label: "Как добраться", level: 2 });

  if (destination.travelTips.length > 0) {
    items.push({ id: "travel-tips", label: "Советы путешественникам", level: 2 });
  }

  return items;
}

export default function DestinationDetailView({
  destination,
  initialTours,
  knowledgeLinks,
  flightSidebar,
}: DestinationDetailViewProps) {
  const tours = useRepositoryTourListings(initialTours);
  const matchedTours = matchToursForDestination(tours, destination);
  const catalogHref = destinationCatalogLink(destination);
  const excursionsHref = destinationExcursionsHref(destination.id);
  const linkedPlaceSlugs = placeSlugsForDestination(destination.id);
  const primaryPlaceSlug = pairedPlaceSlugForDestination(destination.id);
  const primaryPlace = primaryPlaceSlug ? getPlaceBySlug(primaryPlaceSlug) : undefined;
  const tocItems = buildDestinationTocItems(destination);
  const relatedItems = knowledgeLinks ? flattenKnowledgeLinks(knowledgeLinks) : [];
  const editorialTheme = resolveDestinationEditorialTheme(destination.id);
  const taxonomy = resolveDestinationTaxonomy(destination);

  const destinationAside = (
    <>
      {flightSidebar}
      <DestinationInsuranceTeaser destinationName={destination.name} />
      <div className="rounded-card border border-border-subtle bg-surface-elevated p-5 shadow-card">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-sky" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-charcoal">Лучший сезон</p>
            <p className="mt-1 text-sm leading-relaxed text-slate">{destination.bestSeason}</p>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-3 border-t border-border-subtle pt-4">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-sky" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-charcoal">Рекомендуемый срок</p>
            <p className="mt-1 text-sm leading-relaxed text-slate">{destination.idealDuration}</p>
          </div>
        </div>
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
      </div>
    </>
  );

  return (
    <>
      <section
        data-editorial-theme={editorialTheme}
        className="group relative min-h-[52svh] overflow-hidden border-b-4 border-[var(--editorial-accent)] sm:min-h-[58svh]"
      >
        <SafeImage
          src={destination.image}
          alt={destination.imageAlt ?? destinationHeroAlt(destination.name)}
          fill
          priority
          preferLocalMedia
          className="editorial-media-zoom object-cover object-[center_35%] sm:object-center"
          sizes="100vw"
          placeholderVariant="destination"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--editorial-media-overlay)_0%,rgb(15_23_42/0.62)_45%,rgb(15_23_42/0.12)_82%),linear-gradient(to_top,rgb(15_23_42/0.82),transparent_58%)]" />
        <div className="absolute right-5 top-5 hidden items-center gap-3 text-white/70 lg:flex" aria-hidden>
          <span className="h-px w-10 bg-white/50" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em]">Argentina</span>
        </div>
        <div className={cn(siteContainerClass, "relative flex min-h-[52svh] flex-col justify-end py-8 sm:min-h-[58svh] sm:py-10")}>
          <PageBreadcrumbs
            variant="on-dark"
            separator="dash"
            className="mb-4"
            items={[
              { label: "Главная", href: "/" },
              { label: "Направления и места", href: "/destinations" },
              { label: destination.name },
            ]}
          />
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="min-w-0 flex-1">
              <span className="inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/90 backdrop-blur-sm">
                {taxonomy.kindLabel} · {destination.regionGroup}
              </span>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-white/80">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                {taxonomy.administrativeArea}
              </p>
              <div className="mt-4 h-1 w-12 rounded-full bg-[var(--editorial-accent)]" aria-hidden />
              <h1 className="mt-3 max-w-4xl font-display text-3xl font-bold leading-[1.06] tracking-[-0.035em] text-white sm:text-4xl lg:text-5xl">
                {destination.name}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">{destination.description}</p>
            </div>
            <SharePageLinkButton
              title={destination.name}
              className="shrink-0 border-white/20 bg-white/10 text-white hover:border-white/40 hover:bg-white/20 hover:text-white"
            />
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-8 pb-2 sm:-mt-10">
        <div className={siteContainerClass}>
          <HubQuickFactsGrid
            facts={buildDestinationQuickFacts(destination)}
            columns={3}
            className="max-sm:grid-flow-col max-sm:auto-cols-[82%] max-sm:snap-x max-sm:overflow-x-auto max-sm:pb-2 [&>article]:snap-start"
          />
        </div>
      </section>

      <section className={cn(siteContainerClass, "py-12 sm:py-16")}>
        <ContentReadingLayout
          tocItems={tocItems}
          aside={destinationAside}
          articleClassName="content-reading-prose--wide"
          relatedItems={[]}
        >
          <div className="space-y-10">
            <div>
              <h2
                id="about"
                className={cn("font-heading text-2xl font-bold text-charcoal", siteScrollAnchorClass)}
              >
                О направлении
              </h2>
              <p className="mt-4">{destination.intro}</p>
              {linkedPlaceSlugs.length > 0 ? (
                <div className="mt-6 rounded-card border border-sky/15 bg-gradient-to-br from-sky/5 to-white p-5 sm:p-6">
                  <p className="text-sm font-medium text-charcoal">
                    {destination.id === "patagonia"
                      ? "Ключевые места Патагонии в справочнике"
                      : primaryPlace
                        ? `Справочник: ${primaryPlace.name}`
                        : "Связанные места"}
                  </p>
                  <p className="mt-1 text-sm text-slate">
                    {destination.id === "patagonia"
                      ? "Парки, ледники и города — с картой, практическими деталями и подборками."
                      : "Практические детали, карта и связанные точки маршрута — без дублирования регионального гида."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {linkedPlaceSlugs.slice(0, destination.id === "patagonia" ? 6 : 1).map((slug) => {
                      const place = getPlaceBySlug(slug);
                      if (!place) return null;
                      return (
                        <Link
                          key={slug}
                          href={placeHref(slug)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-sky/25 bg-surface-elevated px-3 py-1.5 text-sm font-medium text-sky-ink hover:bg-sky/5"
                        >
                          {place.name}
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                        </Link>
                      );
                    })}
                    <Link
                      href={destination.id === "patagonia" ? "/places?region=Патагония" : "/places"}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate hover:text-sky-ink"
                    >
                      {destination.id === "patagonia" ? "Все места Патагонии" : "Весь справочник"}
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>

            <PageSlotImage
              pageId={`destination:${destination.id}`}
              slotId="section"
              role="section"
              className="max-w-none"
            />

            <div>
              <h2
                id="highlights"
                className={cn("font-heading text-xl font-bold text-charcoal", siteScrollAnchorClass)}
              >
                Главное в направлении
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {destination.highlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 rounded-xl border border-border-subtle bg-surface-elevated px-4 py-3 text-sm text-charcoal shadow-sm"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {destination.gallery && destination.gallery.length > 1 ? (
              <div>
                <h2
                  id="gallery"
                  className={cn("font-heading text-xl font-bold text-charcoal", siteScrollAnchorClass)}
                >
                  Галерея
                </h2>
                <DetailPhotoGallery
                  images={destination.gallery}
                  title={destination.name}
                  altForImage={(i) =>
                    destinationGalleryAlt(destination.name, i, destination.gallery?.length)
                  }
                  className="mt-4 sm:grid-cols-3"
                  placeholderVariant="destination"
                />
              </div>
            ) : null}

            <div
              id="how-to-get"
              className={cn(
                "rounded-card border border-sky/15 bg-gradient-to-br from-sky/5 to-white p-6 sm:p-8",
                siteScrollAnchorClass
              )}
            >
              <div className="flex items-start gap-3">
                <Plane className="mt-0.5 h-5 w-5 shrink-0 text-sky" aria-hidden />
                <div>
                  <h2 className="font-heading text-lg font-bold text-charcoal">Как добраться</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate">{destination.howToGetThere}</p>
                </div>
              </div>
            </div>

            {destination.travelTips.length > 0 ? (
              <div>
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-warning" aria-hidden />
                  <h2
                    id="travel-tips"
                    className={cn("font-heading text-xl font-bold text-charcoal", siteScrollAnchorClass)}
                  >
                    Советы путешественникам
                  </h2>
                </div>
                <ul className="mt-4 space-y-3">
                  {destination.travelTips.map((tip) => (
                    <li
                      key={tip}
                      className="rounded-card border border-warning/20 bg-warning-muted px-4 py-3 text-sm leading-relaxed text-charcoal"
                    >
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </ContentReadingLayout>
      </section>

      <section className="bg-surface-muted py-12 sm:py-16">
        <div className={siteContainerClass}>
          {matchedTours.length > 0 ? (
            <TourEmbedSection
              config={{
                variant: "grid",
                title: "Туры по направлению",
                subtitle: `Найдено ${matchedTours.length} подходящих маршрутов`,
                limit: 6,
                source: { kind: "destination", destinationSlug: destination.id },
                catalogHref: catalogHref,
                catalogLabel: "Смотреть все в каталоге",
                tone: "default",
              }}
              initialTours={tours}
            />
          ) : (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="font-heading text-2xl font-bold text-charcoal sm:text-3xl">Туры по направлению</h2>
                  <p className="mt-2 text-slate">Пока нет точных совпадений — откройте полный каталог</p>
                </div>
                <Link href={catalogHref} className="text-sm font-medium text-sky-ink hover:underline">
                  Смотреть все в каталоге →
                </Link>
              </div>
              <div className="mt-8 rounded-card border border-dashed border-border-default bg-surface-elevated px-6 py-12 text-center">
                <p className="font-medium text-charcoal">В каталоге нет точных совпадений</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate">
                  Откройте каталог с фильтром по региону или свяжитесь с нами — поможем подобрать маршрут.
                </p>
                <Link href={catalogHref} className="mt-6 inline-block">
                  <Button variant="outline">Перейти в каталог</Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {relatedItems.length > 0 ? (
        <section className="bg-surface-elevated py-12 sm:py-16">
          <div className={siteContainerClass}>
            <RelatedContentCards title="Связанные материалы" items={relatedItems} />
          </div>
        </section>
      ) : null}
    </>
  );
}
