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
import SharePageLinkButton from "@/components/content/SharePageLinkButton";
import DestinationInsuranceTeaser from "@/components/destinations/DestinationInsuranceTeaser";
import { PageSlotImage } from "@/components/media/ContentSectionImage";
import RelatedContentCards from "@/components/content/RelatedContentCards";
import TourEmbedSection from "@/components/embed/TourEmbedSection";
import { SafeImage } from "@/components/ui/safe-image";
import { Button } from "@/components/ui/button";
import type { DestinationPage } from "@/data/destination-pages";
import { destinationGalleryAlt, destinationHeroAlt } from "@/lib/media-alt-text";
import { getPlaceBySlug } from "@/data/places-seed";
import { destinationExcursionsHref } from "@/data/excursion-city-links";
import { useRepositoryTourListings } from "@/hooks/useRepositoryTourListings";
import { destinationCatalogLink, matchToursForDestination } from "@/lib/destinations";
import { flattenKnowledgeLinks } from "@/lib/content-related-links";
import { pairedPlaceSlugForDestination, placeSlugsForDestination } from "@/lib/geography-links";
import type { KnowledgeLinksBundle } from "@/lib/knowledge-internal-links";
import { placeHref } from "@/lib/places-repository";
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

function FactPill({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-sky-200" aria-hidden />
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-white/60">{label}</p>
        <p className="text-sm font-medium leading-snug text-white">{value}</p>
      </div>
    </div>
  );
}

function buildDestinationTocItems(destination: DestinationPage): ContentTocItem[] {
  const items: ContentTocItem[] = [
    { id: "about", label: "О направлении", level: 2 },
    { id: "highlights", label: "Главное в регионе", level: 2 },
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

  const destinationAside = (
    <>
      {flightSidebar}
      <DestinationInsuranceTeaser destinationName={destination.name} />
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-sky" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-charcoal">Лучший сезон</p>
            <p className="mt-1 text-sm leading-relaxed text-slate">{destination.bestSeason}</p>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-3 border-t border-gray-100 pt-4">
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
      <section className="relative min-h-[48vh] overflow-hidden sm:min-h-[52vh]">
        <SafeImage
          src={destination.image}
          alt={destination.imageAlt ?? destinationHeroAlt(destination.name)}
          fill
          priority
          className="object-cover"
          sizes="100vw"
          placeholderVariant="destination"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/95 via-charcoal/45 to-charcoal/20" />
        <div className={cn(siteContainerClass, "relative flex min-h-[48vh] flex-col justify-end py-10 sm:min-h-[52vh] sm:py-12")}>
          <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-white/75">
            <Link href="/" className="hover:text-white">
              Главная
            </Link>
            <span aria-hidden>–</span>
            <Link href="/destinations" className="hover:text-white">
              Регионы и места
            </Link>
            <span aria-hidden>–</span>
            <span className="text-white">{destination.name}</span>
          </nav>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <span className="inline-flex w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
                {destination.regionGroup}
              </span>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-white/80">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                {destination.region}
              </p>
              <h1 className="mt-2 max-w-3xl font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                {destination.name}
              </h1>
              <p className="mt-3 max-w-2xl text-base text-white/85 sm:text-lg">{destination.description}</p>
            </div>
            <SharePageLinkButton
              title={destination.name}
              className="shrink-0 border-white/20 bg-white/10 text-white hover:border-white/40 hover:bg-white/20 hover:text-white"
            />
          </div>
          <div className="mt-6 grid max-w-3xl gap-2 sm:grid-cols-3">
            <FactPill icon={Clock} label="На сколько" value={destination.idealDuration} />
            <FactPill icon={CalendarDays} label="Сезон" value={destination.bestSeason.split(";")[0]} />
            <FactPill icon={Plane} label="Как добраться" value="См. ниже" />
          </div>
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
                <div className="mt-6 rounded-2xl border border-sky/15 bg-gradient-to-br from-sky/5 to-white p-5 sm:p-6">
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
                          className="inline-flex items-center gap-1.5 rounded-full border border-sky/25 bg-white px-3 py-1.5 text-sm font-medium text-sky hover:bg-sky/5"
                        >
                          {place.name}
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                        </Link>
                      );
                    })}
                    <Link
                      href={destination.id === "patagonia" ? "/places?region=Патагония" : "/places"}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate hover:text-sky"
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
                Главное в регионе
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {destination.highlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-charcoal shadow-sm"
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
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {destination.gallery.map((src, i) => (
                    <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-xl">
                      <SafeImage
                        src={src}
                        alt={destinationGalleryAlt(
                          destination.name,
                          i,
                          destination.gallery?.length,
                        )}
                        fill
                        className="object-cover"
                        sizes="50vw"
                        placeholderVariant="destination"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div
              id="how-to-get"
              className={cn(
                "rounded-2xl border border-sky/15 bg-gradient-to-br from-sky/5 to-white p-6 sm:p-8",
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
                  <Lightbulb className="h-5 w-5 text-amber-500" aria-hidden />
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
                      className="rounded-xl border border-amber-100/80 bg-amber-50/50 px-4 py-3 text-sm leading-relaxed text-charcoal"
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
                title: "Туры в регионе",
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
                  <h2 className="font-heading text-2xl font-bold text-charcoal sm:text-3xl">Туры в регионе</h2>
                  <p className="mt-2 text-slate">Пока нет точных совпадений — откройте полный каталог</p>
                </div>
                <Link href={catalogHref} className="text-sm font-medium text-sky hover:underline">
                  Смотреть все в каталоге →
                </Link>
              </div>
              <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
                <p className="font-medium text-charcoal">Туры по этому направлению скоро появятся</p>
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
        <section className="bg-white py-12 sm:py-16">
          <div className={siteContainerClass}>
            <RelatedContentCards title="Связанные материалы" items={relatedItems} />
          </div>
        </section>
      ) : null}
    </>
  );
}
