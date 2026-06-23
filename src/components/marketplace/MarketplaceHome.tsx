"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
import FilterBar from "./FilterBar";
import HomeExcursionFilterStrip from "./HomeExcursionFilterStrip";
import MarketplaceTourCard from "./MarketplaceTourCard";
import TourEmbedSection from "@/components/embed/TourEmbedSection";
import type { TourEmbedConfig } from "@/types/tour-embed";
import BlogCard from "@/components/BlogCard";
import { tripsWord, filtersWord } from "@/lib/pluralize";
import PlatformStatsBlock from "./PlatformStatsBlock";
import HomeHeroCollage from "./HomeHeroCollage";
import HomeTestimonialsSection from "./HomeTestimonialsSection";
import SectionShell from "@/components/layout/SectionShell";
import type { PlatformStats } from "@/lib/organizer-public";
import { getRecommendedListings } from "@/lib/tour-recommendations";
import { filterArgentinaHomepageTours } from "@/lib/homepage-tours";
import { siteContainerClass, siteScrollAnchorClass } from "@/lib/site-container";
import HubQuickFactsGrid from "@/components/guide/hub/HubQuickFactsGrid";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import PersonalizedRecommendationsSection from "@/components/personalization/PersonalizedRecommendationsSection";
import type { ExcursionCity, ExcursionListing } from "@/types/excursion";
import { getHomeHeroAlt, getHomeHeroImage, getHomeShowcaseImages } from "@/lib/media-resolver";

const HOME_HERO_IMAGE = getHomeHeroImage();
const HOME_HERO_ALT = getHomeHeroAlt();
const HOME_SHOWCASE = getHomeShowcaseImages();
/** Витрина регионов на главной — 6 карточек с локальными cover */
const HOME_FEATURED_REGIONS = POPULAR_DESTINATIONS.slice(0, 6);

interface MarketplaceHomeProps {
  tours: TourListing[];
  blogPosts: BlogPost[];
  testimonials: Testimonial[];
  platformStats: PlatformStats;
  excursionCities?: ExcursionCity[];
  travelPrepStrip?: React.ReactNode;
  showHomepageRecommendationsV2?: boolean;
  personalizedTours?: TourListing[];
  personalizedExcursions?: ExcursionListing[];
  personalizedActive?: boolean;
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
  showHomepageRecommendationsV2 = false,
  personalizedTours = [],
  personalizedExcursions = [],
  personalizedActive = false,
}: MarketplaceHomeProps) {
  const router = useRouter();
  const tours = useRepositoryTourListings(initialTours);
  const homepageTours = useMemo(() => filterArgentinaHomepageTours(tours), [tours]);
  const { currency, t } = useLocaleCurrency();
  const [filters, setFilters] = useState<TourFilters>(() =>
    getDefaultFilters(currency, tours)
  );
  const [searchTab, setSearchTab] = useState<HomeSearchTab>("tours");

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
        className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-br from-[#f4f9fc] via-white to-sky/[0.08]"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_100%_0%,rgba(56,189,248,0.12),transparent)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute -right-16 top-8 h-56 w-56 rounded-full bg-sky/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-sun/10 blur-3xl" aria-hidden />

        <div className={cn(siteContainerClass, "relative py-10 md:py-12 lg:py-16")}>
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_min(42%,380px)] xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-14">
            <div className="min-w-0">
              <span className="inline-flex rounded-full border border-sky/15 bg-sky/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky">
                {t("home.hero.eyebrow")}
              </span>
              <h1 className="mt-4 max-w-2xl font-display text-3xl font-bold leading-[1.12] tracking-tight text-charcoal sm:text-4xl lg:text-[2.65rem]">
                {t("home.hero.title")}{" "}
                <span className="text-sky">{t("home.hero.titleAccent")}</span>
              </h1>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-slate sm:text-[1.05rem]">
                {t("home.hero.subtitle")}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  href="/podbor"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "rounded-full gap-2",
                  })}
                >
                  <Compass className="h-4 w-4" aria-hidden />
                  {t("home.hero.ctaRoute")}
                </Link>
                <Link
                  href="/podbor"
                  className="inline-flex items-center gap-1 text-sm font-medium text-sky hover:underline"
                >
                  {t("home.hero.ctaHint")}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>

            <HomeHeroCollage
              heroSrc={HOME_HERO_IMAGE}
              heroAlt={HOME_HERO_ALT}
              showcase={HOME_SHOWCASE}
            />
          </div>

          <div className="mt-8 lg:sticky lg:top-[calc(var(--site-header-height,72px)+0.75rem)] lg:z-20 lg:pb-2">
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

          {searchTab === "tours" ? (
            <div className="mt-4">
              <FilterBar tours={tours} filters={filters} onChange={setFilters} />
            </div>
          ) : null}

          {searchTab === "excursions" ? (
            <div className="mt-4">
              <HomeExcursionFilterStrip />
            </div>
          ) : null}
        </div>
      </section>

      {!hasActiveSearch && travelPrepStrip ? travelPrepStrip : null}

      {hasActiveSearch ? (
        <section id="tour-results" className={cn(siteContainerClass, "py-8", siteScrollAnchorClass)}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-6">
            <p className="text-sm text-slate">
              Найдено{" "}
              <span className="font-semibold text-charcoal">{filtered.length}</span>{" "}
              {tripsWord(filtered.length)}
              {activeCount > 0 ? (
                <span className="ml-2 text-sky">· {filtersWord(activeCount)}</span>
              ) : null}
            </p>
            <div className="flex items-center gap-2">
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
                className="text-sm font-medium text-sky hover:underline"
              >
                Открыть каталог →
              </Link>
            </div>
          </div>
          {filtered.length > 0 ? (
            <div className="grid gap-5 py-8 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.slice(0, 6).map((t) => (
                <MarketplaceTourCard key={t.id} tour={t} />
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
      ) : (
        <SectionShell
          reveal
          tone="muted"
          eyebrow="Площадка"
          title="Почему с нами"
          subtitle="Честные условия, малые группы и русскоязычные гиды — без скрытых комиссий и накрученных рейтингов"
          className="border-b border-gray-100 py-10"
        >
          <HubQuickFactsGrid columns={4} facts={valueProps} />
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <p className="text-center text-sm text-slate">
              В каталоге{" "}
              <span className="font-semibold text-charcoal">
                {homepageTours.length} {tripsWord(homepageTours.length)}
              </span>{" "}
              — выбирайте даты и отправляйте заявку
            </p>
            <Link href="/tours">
              <Button size="lg" className="rounded-full px-8">
                Открыть каталог
              </Button>
            </Link>
          </div>
        </SectionShell>
      )}

      <PlatformStatsBlock initialStats={platformStats} />

      {/* Regions & places */}
      <SectionShell
        reveal
        eyebrow="География"
        title="Регионы и места"
        subtitle="Региональные гиды для планирования и справочник парков, городов и достопримечательностей"
        href="/destinations"
        linkLabel="Обзор регионов"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HOME_FEATURED_REGIONS.map((dest) => (
            <Link
              key={dest.id}
              href={destinationHref(dest.id)}
              className="group relative block h-48 overflow-hidden rounded-2xl ring-1 ring-gray-100 transition-shadow hover:shadow-elevated sm:h-56"
            >
              <Image
                src={dest.image}
                alt={dest.imageAlt ?? dest.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/25 to-transparent" />
              <div className="absolute bottom-0 p-4 text-white">
                <p className="text-[11px] font-medium uppercase tracking-wider text-white/70">{dest.region}</p>
                <h3 className="mt-1 font-heading text-lg font-bold">{dest.name}</h3>
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-white/80">{dest.description}</p>
              </div>
            </Link>
          ))}
        </div>
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
      </SectionShell>

      {showHomepageRecommendationsV2 ? (
        <PersonalizedRecommendationsSection
          initialTours={personalizedTours}
          initialExcursions={personalizedExcursions}
          toursPersonalized={personalizedActive}
          excursionsPersonalized={personalizedActive}
          variant="homepage"
        />
      ) : null}

      {/* Tour collections */}
      <section className="border-y border-gray-100 bg-white py-12 md:py-14">
        <div className={cn(siteContainerClass, "space-y-14")}>
          <TourGrid
            id="recommended"
            title="Рекомендуем"
            subtitle="По рейтингу и актуальности"
            tours={recommendedTours}
          />
          {youtravelTours.length > 0 ? (
            <TourGrid
              title="Авторские туры YouTravel"
              subtitle="Партнёрские путешествия с датами заезда на YouTravel.me"
              tours={youtravelTours}
            />
          ) : null}
          <TourGrid
            title="Горящие даты"
            subtitle="Только туры с реальной скидкой и ближайшими датами"
            tours={hotTours}
          />
        </div>
      </section>

      {!hasActiveSearch ? <HomeTestimonialsSection testimonials={testimonials} /> : null}

      {/* Blog */}
      {!hasActiveSearch ? (
        <SectionShell
          reveal
          eyebrow="Блог"
          title="Статьи из блога"
          subtitle="Советы и вдохновение перед поездкой"
          href="/blog"
          linkLabel="Все статьи"
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {blogPosts.slice(0, 3).map((p) => (
              <BlogCard key={p.id} post={p} />
            ))}
          </div>
        </SectionShell>
      ) : null}

      {/* Guide & immigration */}
      {!hasActiveSearch ? (
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
            <Link
              href="/guide"
              className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15"
            >
              Путеводитель
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/immigration"
              className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15"
            >
              Иммиграция
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </SectionShell>
      ) : null}
    </>
  );
}
