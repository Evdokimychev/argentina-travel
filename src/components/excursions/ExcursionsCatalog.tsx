"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ExcursionCard from "@/components/excursions/ExcursionCard";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { siteContainerClass } from "@/lib/site-container";
import type { ExcursionCity, ExcursionListing } from "@/types/excursion";
import { cn } from "@/lib/cn";
import { ChevronLeft, ChevronRight, MapPin, Search } from "lucide-react";

export type ExcursionSortOption = "popular" | "rating" | "price_asc" | "price_desc";

const PAGE_SIZE = 12;

type ExcursionsCatalogProps = {
  excursions: ExcursionListing[];
  cities: ExcursionCity[];
  initialCitySlug?: string;
  title?: string;
  subtitle?: string;
};

function sortExcursions(items: ExcursionListing[], sort: ExcursionSortOption): ExcursionListing[] {
  const copy = [...items];
  switch (sort) {
    case "rating":
      return copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "price_asc":
      return copy.sort((a, b) => (a.priceValue ?? Number.MAX_SAFE_INTEGER) - (b.priceValue ?? Number.MAX_SAFE_INTEGER));
    case "price_desc":
      return copy.sort((a, b) => (b.priceValue ?? 0) - (a.priceValue ?? 0));
    default:
      return copy.sort((a, b) => b.reviewCount - a.reviewCount);
  }
}

export default function ExcursionsCatalog({
  excursions,
  cities,
  initialCitySlug,
  title,
  subtitle,
}: ExcursionsCatalogProps) {
  const { t } = useLocaleCurrency();
  const resolvedTitle = title ?? t("excursions.title");
  const resolvedSubtitle = subtitle ?? t("excursions.subtitle");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("query") ?? "");
  const [citySlug, setCitySlug] = useState(initialCitySlug ?? searchParams.get("city") ?? "");
  const [sort, setSort] = useState<ExcursionSortOption>(
    (searchParams.get("sort") as ExcursionSortOption) || "popular"
  );
  const [page, setPage] = useState(Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return excursions.filter((item) => {
      if (citySlug && item.citySlug !== citySlug) return false;
      if (!normalizedQuery) return true;
      return (
        item.title.toLowerCase().includes(normalizedQuery) ||
        (item.tagline?.toLowerCase().includes(normalizedQuery) ?? false) ||
        item.cityName.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [excursions, query, citySlug]);

  const sorted = useMemo(() => sortExcursions(filtered, sort), [filtered, sort]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const updateUrl = (next: { query?: string; city?: string; sort?: ExcursionSortOption; page?: number }) => {
    const params = new URLSearchParams();
    const q = next.query ?? query;
    const city = next.city ?? citySlug;
    const s = next.sort ?? sort;
    const p = next.page ?? 1;
    if (q.trim()) params.set("query", q.trim());
    if (city) params.set("city", city);
    if (s !== "popular") params.set("sort", s);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    router.replace(qs ? `/excursions?${qs}` : "/excursions", { scroll: false });
  };

  return (
    <div className="pb-16">
      <div className={cn(siteContainerClass, "pt-8")}>
        <h1 className="font-display text-3xl font-bold text-charcoal">{resolvedTitle}</h1>
        <p className="mt-2 text-slate">{resolvedSubtitle}</p>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
                updateUrl({ query: event.target.value, page: 1 });
              }}
              placeholder={t("excursions.searchPlaceholder")}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none ring-sky/30 transition focus:border-sky focus:ring-2"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate">
            <span className="whitespace-nowrap">{t("excursions.sortLabel")}</span>
            <select
              value={sort}
              onChange={(event) => {
                const value = event.target.value as ExcursionSortOption;
                setSort(value);
                setPage(1);
                updateUrl({ sort: value, page: 1 });
              }}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-charcoal outline-none focus:border-sky focus:ring-2 focus:ring-sky/30"
            >
              <option value="popular">{t("excursions.sort.popular")}</option>
              <option value="rating">{t("excursions.sort.rating")}</option>
              <option value="price_asc">{t("excursions.sort.priceAsc")}</option>
              <option value="price_desc">{t("excursions.sort.priceDesc")}</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setCitySlug("");
              setPage(1);
              updateUrl({ city: "", page: 1 });
            }}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition",
              !citySlug ? "bg-sky text-white" : "bg-charcoal/5 text-charcoal hover:bg-sky/10"
            )}
          >
            {t("excursions.allCities")}
          </button>
          {cities.map((city) => (
            <button
              key={city.slug}
              type="button"
              onClick={() => {
                setCitySlug(city.slug);
                setPage(1);
                updateUrl({ city: city.slug, page: 1 });
              }}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition",
                citySlug === city.slug
                  ? "bg-sky text-white"
                  : "bg-charcoal/5 text-charcoal hover:bg-sky/10"
              )}
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>

      <div className={cn(siteContainerClass, "mt-8")}>
        {sorted.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title={
              excursions.length === 0
                ? t("excursions.emptySoonTitle")
                : t("excursions.emptyFilterTitle")
            }
            description={
              excursions.length === 0
                ? t("excursions.emptySoonDescription")
                : t("excursions.emptyFilterDescription")
            }
          />
        ) : (
          <>
            <p className="mb-4 text-sm text-slate">
              {sorted.length}{" "}
              {sorted.length === 1
                ? t("excursions.countOne")
                : sorted.length < 5
                  ? t("excursions.countFew")
                  : t("excursions.countMany")}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((excursion) => (
                <ExcursionCard key={`${excursion.partner}-${excursion.slug}`} excursion={excursion} />
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => {
                    const next = currentPage - 1;
                    setPage(next);
                    updateUrl({ page: next });
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                  {t("excursions.prev")}
                </button>
                <span className="text-sm text-slate">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => {
                    const next = currentPage + 1;
                    setPage(next);
                    updateUrl({ page: next });
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:opacity-40"
                >
                  {t("excursions.next")}
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ) : null}
          </>
        )}

        {cities.length > 0 ? (
          <div className="mt-10 flex flex-wrap gap-2 border-t border-gray-100 pt-6">
            {cities.map((city) => (
              <Link
                key={city.slug}
                href={`/excursions/city/${city.slug}`}
                className="inline-flex items-center gap-1 rounded-full bg-charcoal/5 px-3 py-1 text-xs font-medium text-charcoal transition hover:bg-sky/10 hover:text-sky"
              >
                <MapPin className="h-3 w-3" aria-hidden />
                {city.name}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
