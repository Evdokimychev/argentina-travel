"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Fragment, Suspense, use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { TourListing, TourFilters, BlogPost, Testimonial } from "@/types";
import { filterTours, countActiveFilters, getDefaultFilters } from "@/lib/filter-tours";
import { buildCatalogFilterHref } from "@/lib/catalog-filter-url";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { useSyncPriceFilters } from "@/hooks/useSyncPriceFilters";
import { useRepositoryTourListings } from "@/hooks/useRepositoryTourListings";
import { POPULAR_DESTINATIONS } from "@/data/filters";
import { destinationHref } from "@/lib/destinations";
import HomeMultiSearch, { type HomeSearchTab } from "./HomeMultiSearch";
import MarketplaceHomeHero from "./MarketplaceHomeHero";

const FilterBar = dynamic(() => import("./FilterBar"), {
  loading: () => (
    <div
      className="h-11 min-h-[44px] w-full max-w-full overflow-hidden rounded-full bg-surface-muted/60"
      aria-hidden
    />
  ),
});
import type { TourEmbedConfig } from "@/types/tour-embed";
import { formatCatalogHeadline } from "@/lib/catalog-stats";
import { filtersWord, tripsWord } from "@/lib/pluralize";
import SectionShell from "@/components/layout/SectionShell";
import type { PlatformStats } from "@/lib/organizer-public";
import { getRecommendedListings } from "@/lib/tour-listing-ranking";
import { filterArgentinaHomepageTours } from "@/lib/homepage-tours";
import { getTourListingReactKey } from "@/lib/tour-public-display";
import { siteContainerClass, siteScrollAnchorClass } from "@/lib/site-container";
import HubQuickFactsGrid from "@/components/guide/hub/HubQuickFactsGrid";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import type { ExcursionCity } from "@/types/excursion";
import type { SiteNavigationGlobal } from "@/types/site-globals";
import {
  resolveHomepageBodyModuleOrder,
  type HomepageBodyModuleId,
} from "@/lib/homepage/homepage-module-registry";

// Keep the first screen focused on the primary tour search. These components
// remain server-rendered where they are visible on initial load, while their
// hydration code is split from the homepage entry chunk.
const HomeExcursionFilterStrip = dynamic(() => import("./HomeExcursionFilterStrip"), {
  loading: () => (
    <div className="h-11 w-full animate-pulse rounded-full bg-surface-muted motion-reduce:animate-none" />
  ),
});
const MarketplaceTourCard = dynamic(() => import("./MarketplaceTourCard"));
const CatalogDepartureCalendarButton = dynamic(
  () => import("./CatalogDepartureCalendarButton"),
);
const TourEmbedSection = dynamic(() => import("@/components/embed/TourEmbedSection"));
const BlogCard = dynamic(() => import("@/components/BlogCard"));
const PlatformStatsBlock = dynamic(() => import("./PlatformStatsBlock"));
const HomeTestimonialsSection = dynamic(() => import("./HomeTestimonialsSection"));

const HOME_FEATURED_REGIONS = POPULAR_DESTINATIONS.slice(0, 6);

function homeDestinationCardImage(src: string): string {
  return src.endsWith("/section.jpg")
    ? src.replace(/\/section\.jpg$/, "/section-card.webp")
    : src;
}

export interface MarketplaceHomeCatalogData {
  tours: TourListing[];
  platformStats: PlatformStats;
  showHomepageRecommendationsV2: boolean;
  personalizedTours: TourListing[];
  personalizedActive: boolean;
}

interface MarketplaceHomeProps {
  catalogData: Promise<MarketplaceHomeCatalogData>;
  navigation: Promise<SiteNavigationGlobal>;
  blogPosts: BlogPost[];
  testimonials: Promise<Testimonial[]>;
  excursionCities: Promise<ExcursionCity[]>;
  travelPrepStrip?: React.ReactNode;
  heroCollage?: React.ReactNode;
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

interface MarketplaceHomeIslandProps {
  catalogData: Promise<MarketplaceHomeCatalogData>;
  navigation: Promise<SiteNavigationGlobal>;
  filters: TourFilters;
  setFilters: React.Dispatch<React.SetStateAction<TourFilters>>;
}

function MarketplaceHomeBody({
  catalogData,
  navigation: navigationPromise,
  blogPosts,
  testimonials: testimonialsPromise,
  filters,
  setFilters,
  travelPrepStrip,
}: MarketplaceHomeIslandProps & {
  blogPosts: BlogPost[];
  testimonials: Promise<Testimonial[]>;
  travelPrepStrip?: React.ReactNode;
}) {
  const {
    tours: initialTours,
    platformStats,
    showHomepageRecommendationsV2,
    personalizedTours,
    personalizedActive,
  } = use(catalogData);
  const navigation = use(navigationPromise);
  const testimonials = use(testimonialsPromise);
  const tours = useRepositoryTourListings(initialTours);
  const homepageTours = useMemo(() => filterArgentinaHomepageTours(tours), [tours]);
  const { currency } = useLocaleCurrency();

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
      label: "Источник",
      headline: "Свои и партнёрские предложения",
      detail: "В карточке указано, где проходит заявка или бронирование",
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
      label: "Условия",
      headline: "Для каждого предложения свои",
      detail: "Оплату и отмену проверяйте в карточке и у указанного продавца",
    },
  ];

  const bodyModules = resolveHomepageBodyModuleOrder();

  function renderBodyModule(moduleId: HomepageBodyModuleId) {
    switch (moduleId) {
      case "travel-prep":
        return !hasActiveSearch && navigation.showServices && travelPrepStrip
          ? travelPrepStrip
          : null;
      case "tours-lead":
        if (navigation.showTours && hasActiveSearch) {
          return (
            <section
              id="tour-results"
              className={cn(siteContainerClass, "py-8", siteScrollAnchorClass)}
            >
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
          );
        }
        if (navigation.showTours) {
          return (
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
          );
        }
        return null;
      case "platform-stats":
        return navigation.showTours && !hasActiveSearch ? (
          <PlatformStatsBlock initialStats={platformStats} />
        ) : null;
      case "geography":
        return navigation.showGeography &&
          (navigation.showDestinations || navigation.showPlaces) ? (
          <SectionShell
            reveal
            eyebrow="География"
            title={navigation.showDestinations ? "Регионы и места" : "Места Аргентины"}
            subtitle="Региональные гиды для планирования и справочник парков, городов и достопримечательностей"
            href={navigation.showDestinations ? "/destinations" : "/places"}
            linkLabel={navigation.showDestinations ? "Обзор регионов" : "Все места"}
          >
            {navigation.showDestinations ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-12 sm:gap-4">
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
                      src={homeDestinationCardImage(dest.image)}
                      alt={dest.imageAlt ?? dest.name}
                      fill
                      className="editorial-media-zoom object-cover"
                      sizes={
                        index < 2
                          ? "(max-width: 640px) 100vw, 50vw"
                          : "(max-width: 1024px) 50vw, 25vw"
                      }
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/25 to-transparent" />
                    <div className="absolute bottom-0 p-5 text-white sm:p-6">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                        {dest.region}
                      </p>
                      <h3
                        className={cn(
                          "mt-1 font-display font-bold",
                          index === 0
                            ? "text-2xl sm:text-3xl"
                            : index === 1
                              ? "text-lg sm:text-3xl"
                              : "text-lg sm:text-xl",
                        )}
                      >
                        {dest.name}
                      </h3>
                      <p className="mt-0.5 hidden line-clamp-2 text-xs leading-relaxed text-white/80 sm:block">
                        {dest.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}
            {navigation.showPlaces ? (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
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
              </div>
            ) : null}
          </SectionShell>
        ) : null;
      case "offers":
        return navigation.showTours && !hasActiveSearch ? (
          <section className="border-y border-gray-100 bg-white py-12 md:py-14">
            <div className={siteContainerClass}>
              <TourGrid
                id="recommended"
                title={personalizedActive ? "Подобрано для вас" : "Актуальные предложения"}
                subtitle="Опубликованные туры с доступными датами и понятными условиями"
                tours={featuredTours}
                variant="strip"
              />
            </div>
          </section>
        ) : null;
      case "testimonials":
        return navigation.showTours && !hasActiveSearch ? (
          <HomeTestimonialsSection testimonials={testimonials} />
        ) : null;
      case "journal":
        return navigation.showJournal && !hasActiveSearch ? (
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
        ) : null;
      case "guide-hub":
        return (navigation.showGuide || navigation.showImmigration) && !hasActiveSearch ? (
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
              {navigation.showGuide ? (
                <Link
                  href="/guide"
                  className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15"
                >
                  Путеводитель
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
              {navigation.showImmigration ? (
                <Link
                  href="/immigration"
                  className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15"
                >
                  Иммиграция
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </SectionShell>
        ) : null;
      default: {
        const _exhaustive: never = moduleId;
        return _exhaustive;
      }
    }
  }

  return (
    <>
      {bodyModules.map((moduleId) => {
        const node = renderBodyModule(moduleId);
        return node ? <Fragment key={moduleId}>{node}</Fragment> : null;
      })}
    </>
  );
}

function HomeSearchFallback() {
  return (
    <div
      className="min-h-[19rem] animate-pulse rounded-3xl border border-white/20 bg-white/15 sm:min-h-[17rem] lg:min-h-[9.5rem] lg:border-gray-200/80 lg:bg-white/70 motion-reduce:animate-none"
      role="status"
      aria-label="Загружаем поиск туров"
    />
  );
}

function MarketplaceHomeSearchControls({
  catalogData,
  navigation: navigationPromise,
  excursionCities,
  filters,
  setFilters,
  setSearchTab,
}: MarketplaceHomeIslandProps & {
  excursionCities: Promise<ExcursionCity[]>;
  setSearchTab: React.Dispatch<React.SetStateAction<HomeSearchTab>>;
}) {
  const { tours: initialTours } = use(catalogData);
  const navigation = use(navigationPromise);
  const tours = useRepositoryTourListings(initialTours);
  const router = useRouter();
  const { currency } = useLocaleCurrency();
  const activeCount = countActiveFilters(filters, currency, tours);
  const enabledSearchTabs = useMemo<HomeSearchTab[]>(
    () => [
      ...(navigation.showTours ? (["tours"] as const) : []),
      ...(navigation.showExcursions ? (["excursions"] as const) : []),
      "flights",
    ],
    [navigation.showExcursions, navigation.showTours],
  );

  return (
    <div className="min-h-[19rem] sm:min-h-[17rem] lg:min-h-[9.5rem]">
      <HomeMultiSearch
        tours={tours}
        excursionCities={excursionCities}
        query={filters.query}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        nearMe={filters.nearMe}
        onQueryChange={(query) => setFilters((current) => ({ ...current, query }))}
        onDatesChange={(dateFrom, dateTo) =>
          setFilters((current) => ({ ...current, dateFrom, dateTo }))
        }
        onNearMe={(coords) =>
          setFilters((current) => ({
            ...current,
            nearMe: Boolean(coords),
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
          router.push(
            hasCriteria
              ? buildCatalogFilterHref(filters, "recommended", currency, tours)
              : "/tours",
          );
        }}
      />
    </div>
  );
}

function MarketplaceHomeFilterControls({
  catalogData,
  navigation: navigationPromise,
  filters,
  setFilters,
  searchTab,
}: MarketplaceHomeIslandProps & { searchTab: HomeSearchTab }) {
  const { tours: initialTours } = use(catalogData);
  const navigation = use(navigationPromise);
  const tours = useRepositoryTourListings(initialTours);

  if (navigation.showTours && searchTab === "tours") {
    return (
      <div className="mt-3 min-h-11">
        <FilterBar tours={tours} filters={filters} onChange={setFilters} />
      </div>
    );
  }

  if (navigation.showExcursions && searchTab === "excursions") {
    return (
      <div className="mt-4">
        <HomeExcursionFilterStrip />
      </div>
    );
  }

  return null;
}

export default function MarketplaceHome({
  catalogData,
  navigation,
  blogPosts,
  testimonials,
  excursionCities,
  travelPrepStrip,
  heroCollage,
}: MarketplaceHomeProps) {
  const { currency } = useLocaleCurrency();
  const [filters, setFilters] = useState<TourFilters>(() =>
    getDefaultFilters(currency),
  );
  const [searchTab, setSearchTab] = useState<HomeSearchTab>("tours");

  return (
    <>
      <MarketplaceHomeHero
        heroCollage={heroCollage}
        searchControls={
          <Suspense fallback={<HomeSearchFallback />}>
            <MarketplaceHomeSearchControls
              catalogData={catalogData}
              navigation={navigation}
              excursionCities={excursionCities}
              filters={filters}
              setFilters={setFilters}
              setSearchTab={setSearchTab}
            />
          </Suspense>
        }
        filterControls={
          <Suspense
            fallback={
              <div
                className="mt-3 min-h-11 rounded-full bg-surface-muted/60"
                aria-hidden
              />
            }
          >
            <MarketplaceHomeFilterControls
              catalogData={catalogData}
              navigation={navigation}
              filters={filters}
              setFilters={setFilters}
              searchTab={searchTab}
            />
          </Suspense>
        }
      />

      <Suspense
        fallback={
          <div
            className="min-h-screen border-b border-gray-100 bg-surface-elevated"
            aria-hidden
          />
        }
      >
        <MarketplaceHomeBody
          catalogData={catalogData}
          navigation={navigation}
          blogPosts={blogPosts}
          testimonials={testimonials}
          filters={filters}
          setFilters={setFilters}
          travelPrepStrip={travelPrepStrip}
        />
      </Suspense>
    </>
  );
}
