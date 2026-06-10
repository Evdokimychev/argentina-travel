"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search } from "lucide-react";
import { TourListing, TourFilters, BlogPost, Testimonial } from "@/types";
import { filterTours, countActiveFilters, getDefaultFilters } from "@/lib/filter-tours";
import { buildCatalogFilterHref } from "@/lib/catalog-filter-url";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { useSyncPriceFilters } from "@/hooks/useSyncPriceFilters";
import { useRepositoryTourListings } from "@/hooks/useRepositoryTourListings";
import { POPULAR_DESTINATIONS } from "@/data/filters";
import SearchBlock from "./SearchBlock";
import FilterBar from "./FilterBar";
import MarketplaceTourCard from "./MarketplaceTourCard";
import BlogCard from "@/components/BlogCard";
import TestimonialCard from "@/components/TestimonialCard";
import { tripsWord, filtersWord } from "@/lib/pluralize";
import PlatformStatsBlock from "./PlatformStatsBlock";
import type { PlatformStats } from "@/lib/organizer-public";
import { getRecommendedListings } from "@/lib/tour-recommendations";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

interface MarketplaceHomeProps {
  tours: TourListing[];
  blogPosts: BlogPost[];
  testimonials: Testimonial[];
  platformStats: PlatformStats;
}

function TourGrid({
  title,
  subtitle,
  tours,
  id,
}: {
  title: string;
  subtitle?: string;
  tours: TourListing[];
  id?: string;
}) {
  if (!tours.length) return null;
  return (
    <section id={id} className="py-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-charcoal sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-1 text-slate">{subtitle}</p>}
        </div>
        <Link href="/tours" className="hidden text-sm font-medium text-brand hover:underline sm:block">
          Все туры →
        </Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {tours.map((t) => (
          <MarketplaceTourCard key={t.id} tour={t} />
        ))}
      </div>
    </section>
  );
}

export default function MarketplaceHome({
  tours: initialTours,
  blogPosts,
  testimonials,
  platformStats,
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

  return (
    <>
      {/* Hero + Search */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-light via-white to-sky/10 pb-8 pt-6 sm:pb-12 sm:pt-10">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sun/30 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-sky/30 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-3xl font-bold leading-tight text-charcoal sm:text-4xl lg:text-5xl">
              Путешествия по{" "}
              <span className="text-brand">Аргентине</span>
            </h1>
            <p className="mt-4 text-base text-slate sm:text-lg">
              Авторские туры от проверенных организаторов — от танго Буэнос-Айреса до ледников Патагонии
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-4xl">
            <SearchBlock
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
                  document.getElementById("tour-results")?.scrollIntoView({ behavior: "smooth" });
                } else {
                  router.push("/tours");
                }
              }}
            />
          </div>

          <div className="mx-auto mt-4 max-w-4xl">
            <FilterBar tours={tours} filters={filters} onChange={setFilters} />
          </div>
        </div>
      </section>

      {hasActiveSearch ? (
      <section id="tour-results" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between border-b border-gray-100 py-6">
          <p className="text-sm text-slate">
            Найдено{" "}
            <span className="font-semibold text-charcoal">{filtered.length}</span>{" "}
            {tripsWord(filtered.length)}
            {activeCount > 0 && (
              <span className="ml-2 text-brand">· {filtersWord(activeCount)}</span>
            )}
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
              className="text-sm font-medium text-brand hover:underline"
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
          <div className="pb-10 text-center">
            <Link href="/tours">
              <Button>Смотреть все {filtered.length} {tripsWord(filtered.length)} в каталоге</Button>
            </Link>
          </div>
        ) : null}
      </section>
      ) : (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-brand-light/80 via-white to-sky/10 px-6 py-10 text-center sm:px-10">
            <h2 className="font-display text-2xl font-bold text-charcoal sm:text-3xl">
              Более {tours.length} {tripsWord(tours.length)} по Аргентине
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate sm:text-base">
              Авторские маршруты от местных организаторов — выбирайте даты, сравнивайте программы и
              отправляйте заявку без предоплаты.
            </p>
            <Link href="/tours" className="mt-6 inline-block">
              <Button size="lg">Перейти в каталог туров</Button>
            </Link>
          </div>
        </section>
      )}

      <PlatformStatsBlock initialStats={platformStats} />

      {/* Popular destinations */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-charcoal sm:text-3xl">
            Популярные направления
          </h2>
          <p className="mt-2 text-slate">Откройте для себя лучшие уголки Аргентины</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {POPULAR_DESTINATIONS.map((dest) => (
              <button
                key={dest.id}
                type="button"
                onClick={() =>
                  setFilters((f) => ({ ...f, query: dest.name }))
                }
                className="group relative h-48 overflow-hidden rounded-2xl text-left sm:h-56"
              >
                <Image
                  src={dest.image}
                  alt={dest.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
                <div className="absolute bottom-0 p-4 text-white">
                  <p className="text-xs text-white/70">{dest.region}</p>
                  <h3 className="font-display text-lg font-bold">{dest.name}</h3>
                  <p className="mt-0.5 text-xs text-white/80">{dest.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-white py-12 shadow-sm ring-1 ring-gray-100">
          <div className="px-4 sm:px-6 lg:px-8">
        <TourGrid
          id="recommended"
          title="Рекомендуем"
          subtitle="Подборка по рейтингу, отзывам и актуальности"
          tours={recommendedTours}
        />
        <TourGrid title="Лучшие туры месяца" subtitle="Выбор редакции ArgentinaTravel" tours={bestOfMonth} />
        <TourGrid title="Горящие предложения" subtitle="Успейте забронировать" tours={hotTours} />
        <TourGrid title="Новые туры" subtitle="Свежие маршруты сезона" tours={newTours} />
          </div>
        </section>
      </div>

      {/* Reviews */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-charcoal sm:text-3xl">
            Отзывы путешественников
          </h2>
          {testimonials.length > 0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t) => (
                <TestimonialCard key={t.id} testimonial={t} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-white/60 px-6 py-12 text-center">
              <p className="font-medium text-charcoal">Отзывы появляются после поездок</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate">
                Мы показываем только реальные отзывы с меткой «Проверенная поездка» — без выдуманных
                имён и статичных цитат.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Blog */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-charcoal sm:text-3xl">
              Статьи из блога
            </h2>
            <p className="mt-2 text-slate">Советы и вдохновение для поездки</p>
          </div>
          <Link href="/blog" className="text-sm font-medium text-brand hover:underline">
            Все статьи →
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {blogPosts.slice(0, 3).map((p) => (
            <BlogCard key={p.id} post={p} />
          ))}
        </div>
      </section>

      {/* Why us */}
      <section className="bg-patagonia py-16 text-white" data-scroll-rail-tone="dark">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Почему путешествовать с нами
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Проверенные организаторы", desc: "Каждый гид проходит отбор и имеет реальные отзывы" },
              { title: "Малые группы", desc: "Комфортные размеры групп для лучшего опыта" },
              { title: "На русском языке", desc: "Большинство туров с русскоязычными гидами" },
              { title: "Безопасная оплата", desc: "Заявка без предоплаты — оплата после подтверждения организатором" },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-white/75">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
