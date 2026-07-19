"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Compass, Search } from "lucide-react";
import { TourListing, TourFilters, BlogPost, Testimonial } from "@/types";
import { filterTours, countActiveFilters, getDefaultFilters } from "@/lib/filter-tours";
import { buildCatalogFilterHref } from "@/lib/catalog-filter-url";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { useSyncPriceFilters } from "@/hooks/useSyncPriceFilters";
import { useRepositoryTourListings } from "@/hooks/useRepositoryTourListings";
import { POPULAR_DESTINATIONS } from "@/data/filters";
import { destinationHref } from "@/lib/destinations";
import HomeMultiSearch, { type HomeSearchTab } from "./HomeMultiSearch";

const FilterBar = dynamic(() => import("./FilterBar"), {
  loading: () => (
    <div
      className="h-11 min-h-[44px] w-full max-w-full overflow-hidden rounded-full bg-surface-muted/60"
      aria-hidden
    />
  ),
});
import HomeExcursionFilterStrip from "./HomeExcursionFilterStrip";
import MarketplaceTourCard from "./MarketplaceTourCard";
import CatalogDepartureCalendarButton from "./CatalogDepartureCalendarButton";
import TourEmbedSection from "@/components/embed/TourEmbedSection";
import type { TourEmbedConfig } from "@/types/tour-embed";
import BlogCard from "@/components/BlogCard";
import { formatCatalogHeadline } from "@/lib/catalog-stats";
import { filtersWord, tripsWord } from "@/lib/pluralize";
import PlatformStatsBlock from "./PlatformStatsBlock";
import HomeTestimonialsSection from "./HomeTestimonialsSection";
import SectionShell from "@/components/layout/SectionShell";
import type { PlatformStats } from "@/lib/organizer-public";
import { getRecommendedListings } from "@/lib/tour-recommendations";
import { filterArgentinaHomepageTours } from "@/lib/homepage-tours";
import { getTourListingReactKey } from "@/lib/tour-public-display";
import { siteContainerClass, siteScrollAnchorClass } from "@/lib/site-container";
import HubQuickFactsGrid from "@/components/guide/hub/HubQuickFactsGrid";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import type { ExcursionCity } from "@/types/excursion";
import type { SiteNavigationGlobal } from "@/types/site-globals";

const HOME_FEATURED_REGIONS = POPULAR_DESTINATIONS.slice(0, 6);

interface MarketplaceHomeProps {
  tours: TourListing[];
  blogPosts: BlogPost[];
  testimonials: Testimonial[];
  platformStats: PlatformStats;
  excursionCities?: ExcursionCity[];
  travelPrepStrip?: React.ReactNode;
  heroCollage?: React.ReactNode;
  showHomepageRecommendationsV2?: boolean;
  personalizedTours?: TourListing[];
  personalizedActive?: boolean;
  navigation: SiteNavigationGlobal;
}

function TourGrid({
  title,
  subtitle,
  tours,
  id,
  href = "/tours",
  linkLabel = "Все туры",
  variant = "grid",
}: {
  title: string;
  subtitle?: string;
  tours: TourListing[];
  id?: string;
  href?: string;
  linkLabel?: string;
  variant?: TourEmbedConfig["variant"];
}) {
  if (!tours.length) return null;

  const config: TourEmbedConfig = {
    id,
    variant,
    title,
    subtitle,
    limit: tours.length,
    source: { kind: "slugs", slugs: tours.map((t) => t.slug) },
    catalogHref: href,
    catalogLabel: linkLabel,
    tone: "default",
  };

  return (
    <TourEmbedSection
      config={config}
      initialTours={tours}
      className={cn(id && siteScrollAnchorClass)}
    />
  );
}

export default function MarketplaceHome({
  tours: initialTours,
  blogPosts,
  testimonials,
  platformStats,
  excursionCities = [],
  travelPrepStrip,
  heroCollage,
  showHomepageRecommendationsV2 = false,
  personalizedTours = [],
  personalizedActive = false,
  navigation,
}: MarketplaceHomeProps) {
  const router = useRouter();
  const tours = useRepositoryTourListings(initialTours);
  const homepageTours = useMemo(() => filterArgentinaHomepageTours(tours), [tours]);
  const { currency, t } = useLocaleCurrency();
  const [filters, setFilters] = useState<TourFilters>(() =>
    getDefaultFilters(currency, tours)
  );
  const enabledSearchTabs = useMemo<HomeSearchTab[]>(
    () => [
      ...(navigation.showTours ? (["tours"] as const) : []),
      ...(navigation.showExcursions ? (["excursions"] as const) : []),
      "flights",
    ],
    [navigation.showExcursions, navigation.showTours],
  );
  const [searchTab, setSearchTab] = useState<HomeSearchTab>(
    enabledSearchTabs[0] ?? "flights",
  );

  useSyncPriceFilters(tours, currency, setFilters);

  const filtered = useMemo(
    () => filterTours(tours, filters, currency),
    [tours, filters, currency]
  );
  const activeCount = countActiveFilters(filters, currency, tours);
  const hasActiveSearch = activeCount > 0 || Boolean(filters.query.trim());

  const hotTours = homepageTours
    .filter(
      (t) =>
        t.isHot &&
        t.originalPriceUsd != null &&
        t.originalPriceUsd > t.priceUsd
    )
    .slice(0, 3);
  const recommendedTours = useMemo(
    () => getRecommendedListings(homepageTours, 6),
    [homepageTours]
  );
  const youtravelTours = useMemo(
    () =>
      homepageTours
        .filter((t) => t.partnerSource === "youtravel")
        .slice(0, 6),
    [homepageTours]
  );

  const featuredTours = useMemo(() => {
    const primary =
      showHomepageRecommendationsV2 && personalizedTours.length > 0
        ? personalizedTours
        : recommendedTours;
    const unique = new Map<string, TourListing>();
    for (const tour of [...primary, ...hotTours, ...youtravelTours]) {
      if (!unique.has(tour.slug)) unique.set(tour.slug, tour);
    }
    return [...unique.values()].slice(0, 6);
  }, [hotTours, personalizedTours, recommendedTours, showHomepageRecommendationsV2, youtravelTours]);

  const valueProps = [
    {
      emoji: "🛡",
      label: "Организаторы",
      headline: "Проверенные организаторы",
      detail: "Каждый гид проходит отбор; отзывы появляются только после реальных поездок",
    },
    {
      emoji: "👥",
      label: "Группы",
      headline: "Малые группы",
      detail: "Комфортный размер группы: больше внимания и гибкости в маршруте",
    },
    {
      emoji: "💬",
      label: "Язык",
      headline: "Русскоязычные гиды",
      detail: "Большинство туров проводят гиды, говорящие по-русски",
    },
    {
      emoji: "💳",
      label: "Оплата",
      headline: "Оплата без предоплаты",
      detail: "Оставляете заявку сейчас, платите после подтверждения организатором",
    },
  ];

  return (
    <>
      {/* Hero */}
      <section
        data-scroll-rail-tone="light"
        data-editorial-theme="city"
        className="editorial-hero relative overflow-hidden border-b border-[var(--editorial-line)]"
      >
        <div
          className={cn(
            siteContainerClass,
            "relative py-5 sm:py-8 md:py-9 lg:py-9 xl:py-10",
          )}
        >
          <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)] lg:gap-x-10 lg:gap-y-6 xl:gap-x-14">
            <div className="order-1 min-w-0">
              <span className="editorial-kicker inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] max-lg:!border-white/25 max-lg:!bg-white/10 max-lg:!text-white sm:text-xs sm:tracking-[0.14em]">
                {t("home.hero.eyebrow")}
              </span>
              <div
                className="editorial-rule mt-3 h-1 w-12 rounded-full max-lg:!bg-sky sm:mt-4"
                aria-hidden
              />
              <h1 className="mt-3 max-w-3xl font-display text-[2.1rem] font-bold leading-[1.06] tracking-[-0.03em] text-white sm:mt-4 sm:text-[2.55rem] lg:text-[2.7rem] lg:text-charcoal xl:text-[2.85rem]">
                {t("home.hero.title")}{" "}
                <span className="editorial-accent-text max-lg:!text-sky">
                  {t("home.hero.titleAccent")}
                </span>
              </h1>
              <p className="mt-3 line-clamp-2 max-w-xl text-[0.95rem] leading-relaxed text-white/85 sm:mt-4 sm:line-clamp-none sm:text-[1.05rem] lg:text-slate">
                {t("home.hero.subtitle")}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 sm:mt-5">
                <Link
                  href={navigation.showTours ? "/podbor" : navigation.showExcursions ? "/excursions" : "/services"}
                  className={buttonVariants({
                    variant: "default",
                    size: "default",
                    className: "rounded-full gap-2 px-6",
                  })}
                >
                  <Compass className="h-4 w-4" aria-hidden />
                  {t("home.hero.ctaRoute")}
                </Link>
                {navigation.showTours ? <Link
                  href="/podbor"
                  className="hidden items-center gap-1 text-sm font-medium text-white/90 hover:text-white hover:underline sm:inline-flex lg:text-sky-ink"
                >
                  {t("home.hero.ctaHint")}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link> : null}
              </div>
            </div>

            {heroCollage ? (
              <div className="pointer-events-none absolute inset-y-0 left-1/2 order-3 w-screen -translate-x-1/2 lg:pointer-events-auto lg:static lg:order-2 lg:w-auto lg:translate-x-0">
                {heroCollage}
              </div>
            ) : null}

            <div className="order-2 lg:order-3 lg:col-span-2 lg:sticky lg:top-[calc(var(--site-header-height,72px)+0.75rem)] lg:z-20">
              <HomeMultiSearch
                tours={tours}
                excursionCities={excursionCities}
                query={filters.query}
                dateFrom={filters.dateFrom}
                dateTo={filters.dateTo}
                nearMe={filters.nearMe}
                onQueryChange={(q) => setFilters((f) => ({ ...f, query: q }))}
                onDatesChange={(from, to) =>
                  setFilters((f) => ({ ...f, dateFrom: from, dateTo: to }))
                }
                onNearMe={(coords) =>
                  setFilters((f) => ({
                    ...f,
                    nearMe: !!coords,
                    userCoords: coords,
                  }))
                }
                onTabChange={setSearchTab}
                enabledTabs={enabledSearchTabs}
                onToursSearch={() => {
                  const hasCriteria =
                    filters.query.trim() ||
                    filters.dateFrom ||
                    filters.dateTo ||
                    filters.nearMe ||
                    activeCount > 0;
                  if (hasCriteria) {
                    router.push(buildCatalogFilterHref(filters, "recommended", currency, tours));
                    return;
                  }
                  router.push("/tours");
                }}
              />
            </div>
          </div>

          {navigation.showTours && searchTab === "tours" ? (
            <div className="mt-3 min-h-11">
              <FilterBar tours={tours} filters={filters} onChange={setFilters} />
            </div>
          ) : null}

          {navigation.showExcursions && searchTab === "excursions" ? (
            <div className="mt-4">
              <HomeExcursionFilterStrip />
            </div>
          ) : null}
        </div>
      </section>

      {!hasActiveSearch && navigation.showServices && travelPrepStrip ? travelPrepStrip : null}

      {navigation.showTours && hasActiveSearch ? (
        <section id="tour-results" className={cn(siteContainerClass, "py-8", siteScrollAnchorClass)}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-6">
            <p className="text-sm text-slate">
              Найдено{" "}
              <span className="font-semibold text-charcoal">{filtered.length}</span>{" "}
              {tripsWord(filtered.length)}
              {activeCount > 0 ? (
                <span className="ml-2 text-sky-ink">· {filtersWord(activeCount)}</span>
              ) : null}
            </p>
            <div className="flex items-center gap-2">
              <CatalogDepartureCalendarButton tours={filtered} />
              {activeCount > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters(getDefaultFilters(currency, tours))}
                >
                  Сбросить всё
                </Button>
              ) : null}
              <Link
                href={buildCatalogFilterHref(filters, "recommended", currency, tours)}
                className="text-sm font-medium text-sky-ink hover:underline"
              >
                Открыть каталог →
              </Link>
            </div>
          </div>
          {filtered.length > 0 ? (
            <div className="grid gap-5 py-8 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.slice(0, 6).map((t) => (
                <MarketplaceTourCard key={getTourListingReactKey(t)} tour={t} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title="По вашему запросу ничего не найдено"
              description="Попробуйте изменить фильтры или сбросить их."
              action={{
                label: "Сбросить фильтры",
                onClick: () => setFilters(getDefaultFilters(currency, tours)),
                variant: "outline",
              }}
              bordered={false}
              className="py-16"
            />
          )}
          {filtered.length > 6 ? (
            <div className="pb-4 text-center">
              <Link href={buildCatalogFilterHref(filters, "recommended", currency, tours)}>
                <Button>
                  Смотреть все {filtered.length} {tripsWord(filtered.length)} в каталоге
                </Button>
              </Link>
            </div>
          ) : null}
        </section>
      ) : navigation.showTours ? (
        <SectionShell
          reveal
          tone="muted"
          eyebrow="Площадка"
          title="Почему с нами"
          subtitle="Честные условия, малые группы и русскоязычные гиды — без скрытых комиссий и накрученных рейтингов"
          className="border-b border-gray-100 py-10"
        >
          <HubQuickFactsGrid columns={4} facts={valueProps} className="grid-cols-2" />
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <p className="text-center text-sm text-slate">
              В каталоге{" "}
              <span className="font-semibold text-charcoal">
                {formatCatalogHeadline({
                  nativeCount: platformStats.tourCount,
                  partnerCount: platformStats.partnerTourCount,
                  totalCount: platformStats.totalTourCount,
                  organizerCount: platformStats.organizerCount,
                })}
              </span>{" "}
              по Аргентине — выбирайте даты и отправляйте заявку
            </p>
            <Link href="/tours">
              <Button size="lg" className="rounded-full px-8">
                Открыть каталог
              </Button>
            </Link>
          </div>
        </SectionShell>
      ) : null}

      {navigation.showTours ? <PlatformStatsBlock initialStats={platformStats} /> : null}

      {/* Regions & places */}
      {navigation.showGeography && (navigation.showDestinations || navigation.showPlaces) ? (
      <SectionShell
        reveal
        eyebrow="География"
        title={navigation.showDestinations ? "Регионы и места" : "Места Аргентины"}
        subtitle="Региональные гиды для планирования и справочник парков, городов и достопримечательностей"
        href={navigation.showDestinations ? "/destinations" : "/places"}
        linkLabel={navigation.showDestinations ? "Обзор регионов" : "Все места"}
      >
        {navigation.showDestinations ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-12 sm:gap-4">
          {HOME_FEATURED_REGIONS.map((dest, index) => (
            <Link
              key={dest.id}
              href={destinationHref(dest.id)}
              className={cn(
                "group relative block h-44 overflow-hidden rounded-[1.35rem] ring-1 ring-gray-100 transition-shadow hover:shadow-elevated",
                index === 0
                  ? "col-span-2 h-64 sm:col-span-7 sm:h-72"
                  : index === 1
                    ? "sm:col-span-5 sm:h-72"
                    : "sm:col-span-6 sm:h-56 lg:col-span-3",
              )}
            >
              <Image
                src={dest.image}
                alt={dest.imageAlt ?? dest.name}
                fill
                className="editorial-media-zoom object-cover"
                sizes={index < 2 ? "(max-width: 640px) 100vw, 50vw" : "(max-width: 1024px) 50vw, 25vw"}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/25 to-transparent" />
              <div className="absolute bottom-0 p-5 text-white sm:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">{dest.region}</p>
                <h3 className={cn("mt-1 font-display font-bold", index === 0 ? "text-2xl sm:text-3xl" : index === 1 ? "text-lg sm:text-3xl" : "text-lg sm:text-xl")}>{dest.name}</h3>
                <p className="mt-0.5 hidden line-clamp-2 text-xs leading-relaxed text-white/80 sm:block">{dest.description}</p>
              </div>
            </Link>
          ))}
        </div> : null}
        {navigation.showPlaces ? <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
          <Link
            href="/places"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 font-medium text-charcoal hover:border-sky hover:text-sky"
          >
            Справочник мест
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/places?view=map"
            className="inline-flex items-center gap-1.5 rounded-full border border-sky/25 bg-sky/5 px-4 py-2 font-medium text-sky hover:bg-sky/10"
          >
            Карта мест
          </Link>
          <Link
            href="/collections"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2 font-medium text-slate hover:border-sky hover:text-sky"
          >
            Подборки
          </Link>
        </div> : null}
      </SectionShell>
      ) : null}

      {/* One ranked offer shelf keeps the primary choice focused. */}
      {navigation.showTours ? <section className="border-y border-gray-100 bg-white py-12 md:py-14">
        <div className={siteContainerClass}>
          <TourGrid
            id="recommended"
            title={personalizedActive ? "Подобрано для вас" : "Актуальные предложения"}
            subtitle="Опубликованные туры с доступными датами и понятными условиями"
            tours={featuredTours}
            variant="strip"
          />
        </div>
      </section> : null}

      {navigation.showTours && !hasActiveSearch ? <HomeTestimonialsSection testimonials={testimonials} /> : null}

      {/* Blog */}
      {navigation.showJournal && !hasActiveSearch ? (
        <SectionShell
          reveal
          eyebrow="Блог"
          title="Статьи из блога"
          subtitle="Советы и вдохновение перед поездкой"
          href="/blog"
          linkLabel="Все статьи"
        >
          <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-3">
            {blogPosts.slice(0, 3).map((p) => (
              <div key={p.id} className="min-w-[17rem] snap-start sm:min-w-0">
                <BlogCard post={p} />
              </div>
            ))}
          </div>
        </SectionShell>
      ) : null}

      {/* Guide & immigration */}
      {(navigation.showGuide || navigation.showImmigration) && !hasActiveSearch ? (
        <SectionShell
          reveal
          tone="dark"
          eyebrow="Справочник"
          title="Путеводитель и иммиграция"
          subtitle="Справочник по стране, переезду и практическим советам — дополняет выбор тура"
          className="border-t border-gray-100 py-14"
          scrollRailTone="dark"
        >
          <div className="flex flex-wrap gap-3">
            {navigation.showGuide ? <Link
              href="/guide"
              className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15"
            >
              Путеводитель
              <ArrowRight className="h-4 w-4" />
            </Link> : null}
            {navigation.showImmigration ? <Link
              href="/immigration"
              className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15"
            >
              Иммиграция
              <ArrowRight className="h-4 w-4" />
            </Link> : null}
          </div>
        </SectionShell>
      ) : null}
    </>
  );
}
