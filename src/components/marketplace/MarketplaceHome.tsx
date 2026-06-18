"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Search, ShieldCheck, Users, Wallet } from "lucide-react";
import { TourListing, TourFilters, BlogPost, Testimonial } from "@/types";
import { filterTours, countActiveFilters, getDefaultFilters } from "@/lib/filter-tours";
import { buildCatalogFilterHref } from "@/lib/catalog-filter-url";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { useSyncPriceFilters } from "@/hooks/useSyncPriceFilters";
import { useRepositoryTourListings } from "@/hooks/useRepositoryTourListings";
import { POPULAR_DESTINATIONS } from "@/data/filters";
import { destinationHref } from "@/lib/destinations";
import SearchBlock from "./SearchBlock";
import FilterBar from "./FilterBar";
import MarketplaceTourCard from "./MarketplaceTourCard";
import TourEmbedSection from "@/components/embed/TourEmbedSection";
import type { TourEmbedConfig } from "@/types/tour-embed";
import BlogCard from "@/components/BlogCard";
import TestimonialCard from "@/components/TestimonialCard";
import { tripsWord, filtersWord } from "@/lib/pluralize";
import PlatformStatsBlock from "./PlatformStatsBlock";
import type { PlatformStats } from "@/lib/organizer-public";
import { scrollToSiteAnchor } from "@/lib/scroll-anchor";
import { getRecommendedListings } from "@/lib/tour-recommendations";
import { siteContainerClass, siteScrollAnchorClass } from "@/lib/site-container";
import HubQuickFactsGrid from "@/components/guide/hub/HubQuickFactsGrid";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";

// Local asset (not a remote Unsplash URL): the previous hero pointed at an
// Unsplash photo that now 404s, leaving a grey placeholder on the LCP element.
// A bundled image is reliable and removes an external dependency from the hero.
const HOME_HERO_IMAGE = "/media/destinations/ba/cover.jpg";

interface MarketplaceHomeProps {
  tours: TourListing[];
  blogPosts: BlogPost[];
  testimonials: Testimonial[];
  platformStats: PlatformStats;
  travelPrepStrip?: React.ReactNode;
}

function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-heading text-2xl font-bold text-charcoal sm:text-3xl">{title}</h2>
        {subtitle ? <p className="mt-1.5 text-sm leading-relaxed text-slate sm:text-base">{subtitle}</p> : null}
      </div>
      {href && linkLabel ? (
        <Link
          href={href}
          className="hidden shrink-0 items-center gap-1 text-sm font-medium text-sky hover:underline sm:inline-flex"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
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
  travelPrepStrip,
}: MarketplaceHomeProps) {
  const router = useRouter();
  const tours = useRepositoryTourListings(initialTours);
  const { currency } = useLocaleCurrency();
  const [filters, setFilters] = useState<TourFilters>(() =>
    getDefaultFilters(currency, tours)
  );

  useSyncPriceFilters(tours, currency, setFilters);

  const filtered = useMemo(
    () => filterTours(tours, filters, currency),
    [tours, filters, currency]
  );
  const activeCount = countActiveFilters(filters, currency, tours);
  const hasActiveSearch = activeCount > 0 || Boolean(filters.query.trim());

  const bestOfMonth = tours.filter((t) => t.isBestOfMonth).slice(0, 3);
  const hotTours = tours.filter((t) => t.isHot).slice(0, 3);
  const newTours = tours.filter((t) => t.isNew).slice(0, 3);
  const recommendedTours = useMemo(() => getRecommendedListings(tours, 6), [tours]);

  const valueProps = [
    {
      emoji: "🧭",
      label: "Организаторы",
      headline: "Проверенные авторы",
      detail: "Реальные программы и отзывы после поездок",
    },
    {
      emoji: "👥",
      label: "Группы",
      headline: "Комфортный размер",
      detail: "Малые группы и индивидуальные заявки",
    },
    {
      emoji: "💬",
      label: "Язык",
      headline: "На русском",
      detail: "Большинство туров с русскоязычными гидами",
    },
    {
      emoji: "🛡",
      label: "Оплата",
      headline: "Без предоплаты",
      detail: "Заявка сейчас — оплата после подтверждения",
    },
  ];

  const whyUs = [
    {
      icon: ShieldCheck,
      title: "Проверенные организаторы",
      desc: "Каждый гид проходит отбор; отзывы только после реальных поездок",
    },
    {
      icon: Users,
      title: "Малые группы",
      desc: "Комфортный размер группы — больше внимания и гибкости маршрута",
    },
    {
      icon: Wallet,
      title: "Прозрачная оплата",
      desc: "Отправляете заявку без предоплаты, платите после подтверждения организатором",
    },
    {
      icon: ArrowRight,
      title: "Путеводитель и иммиграция",
      desc: "Справочник по стране и переезду — дополняет выбор тура",
    },
  ];

  return (
    <>
      {/* Hero */}
      <section
        data-scroll-rail-tone="light"
        className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-br from-surface-muted via-white to-sky/[0.06]"
      >
        <div className="pointer-events-none absolute -right-16 top-8 h-56 w-56 rounded-full bg-sky/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-sun/10 blur-3xl" aria-hidden />

        <div className={cn(siteContainerClass, "relative py-10 md:py-12 lg:py-14")}>
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_min(38%,320px)] xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-12">
            <div className="min-w-0">
              <span className="inline-flex rounded-full border border-sky/15 bg-sky/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky">
                Авторские туры
              </span>
              <h1 className="mt-4 max-w-2xl font-display text-3xl font-bold leading-[1.12] tracking-tight text-charcoal sm:text-4xl lg:text-[2.65rem]">
                Путешествия по{" "}
                <span className="text-sky">Аргентине</span>
              </h1>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-slate sm:text-[1.05rem]">
                Маршруты от местных организаторов — от танго Буэнос-Айреса до ледников Патагонии
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
              <div
                className="pointer-events-none absolute -bottom-3 -left-3 hidden h-[calc(100%-0.5rem)] w-[calc(100%-0.5rem)] rounded-2xl border border-sky/20 lg:block"
                aria-hidden
              />
              <div className="relative overflow-hidden rounded-2xl bg-charcoal/5 shadow-card ring-1 ring-gray-100">
                <div className="relative aspect-[16/10] w-full sm:aspect-[5/3] lg:aspect-[4/3]">
                  <Image
                    src={HOME_HERO_IMAGE}
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 360px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/25 via-transparent to-transparent" aria-hidden />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 max-w-4xl lg:max-w-none">
            <SearchBlock
              tours={tours}
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
              onSearch={() => {
                if (hasActiveSearch) {
                  scrollToSiteAnchor("tour-results");
                } else {
                  router.push("/tours");
                }
              }}
            />
          </div>

          <div className="mt-4">
            <FilterBar tours={tours} filters={filters} onChange={setFilters} />
          </div>
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
              <Link href="/tours">
                <Button>
                  Смотреть все {filtered.length} {tripsWord(filtered.length)} в каталоге
                </Button>
              </Link>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="border-b border-gray-100 bg-surface-muted/50 py-10">
          <div className={siteContainerClass}>
            <HubQuickFactsGrid columns={4} facts={valueProps} />
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <p className="text-center text-sm text-slate">
                В каталоге{" "}
                <span className="font-semibold text-charcoal">
                  {tours.length} {tripsWord(tours.length)}
                </span>{" "}
                — выбирайте даты и отправляйте заявку
              </p>
              <Link href="/tours">
                <Button size="lg" className="rounded-full px-8">
                  Открыть каталог
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <PlatformStatsBlock initialStats={platformStats} />

      {/* Destinations */}
      <section className="py-12 md:py-14">
        <div className={siteContainerClass}>
          <SectionHeader
            title="Популярные направления"
            subtitle="Откройте лучшие уголки страны — от столицы до края света"
            href="/destinations"
            linkLabel="Все направления"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {POPULAR_DESTINATIONS.map((dest) => (
              <Link
                key={dest.id}
                href={destinationHref(dest.id)}
                className="group relative block h-48 overflow-hidden rounded-2xl ring-1 ring-gray-100 transition-shadow hover:shadow-elevated sm:h-56"
              >
                <Image
                  src={dest.image}
                  alt={dest.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
                  sizes="(max-width: 768px) 50vw, 25vw"
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
        </div>
      </section>

      {/* Tour collections */}
      <section className="border-y border-gray-100 bg-white py-12 md:py-14">
        <div className={cn(siteContainerClass, "space-y-14")}>
          <TourGrid
            id="recommended"
            title="Рекомендуем"
            subtitle="Подборка по рейтингу, отзывам и актуальности"
            tours={recommendedTours}
          />
          <TourGrid
            title="Лучшие туры месяца"
            subtitle="Выбор редакции"
            tours={bestOfMonth}
          />
          <TourGrid title="Горящие предложения" subtitle="Успейте забронировать" tours={hotTours} />
          <TourGrid title="Новые туры" subtitle="Свежие маршруты сезона" tours={newTours} />
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-surface-muted/50 py-12 md:py-14">
        <div className={siteContainerClass}>
          <SectionHeader title="Отзывы путешественников" subtitle="Только после реальных поездок" />
          {testimonials.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t) => (
                <TestimonialCard key={t.id} testimonial={t} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white/80 px-6 py-12 text-center">
              <p className="font-heading font-semibold text-charcoal">Отзывы появляются после поездок</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate">
                Показываем только отзывы с меткой «Проверенная поездка» — без выдуманных цитат.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Blog */}
      <section className="py-12 md:py-14">
        <div className={siteContainerClass}>
          <SectionHeader
            title="Статьи из блога"
            subtitle="Советы и вдохновение перед поездкой"
            href="/blog"
            linkLabel="Все статьи"
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {blogPosts.slice(0, 3).map((p) => (
              <BlogCard key={p.id} post={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Why us + guide links */}
      <section className="border-t border-gray-100 bg-patagonia py-14 text-white" data-scroll-rail-tone="dark">
        <div className={siteContainerClass}>
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">Почему путешествовать с нами</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            Площадка, справочник и иммиграционный раздел — всё в одном проекте о жизни и поездках в Аргентину.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {whyUs.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm"
              >
                <Icon className="h-6 w-6 text-sun" aria-hidden />
                <h3 className="mt-3 font-heading font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
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
        </div>
      </section>
    </>
  );
}
