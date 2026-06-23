"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import {
  excursionFiltersToSearchParams,
  dedupeCitiesForCatalog,
  getDefaultExcursionCatalogFilters,
} from "@/lib/excursion-catalog-filters";
import { cn } from "@/lib/cn";
import type { ExcursionCity } from "@/types/excursion";

type HomeExcursionSearchBlockProps = {
  cities: ExcursionCity[];
};

function ClearButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate transition-colors hover:bg-gray-100 hover:text-charcoal"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

export default function HomeExcursionSearchBlock({ cities }: HomeExcursionSearchBlockProps) {
  const router = useRouter();
  const { t } = useLocaleCurrency();
  const [query, setQuery] = useState("");
  const [citySlug, setCitySlug] = useState("");
  const [cityOpen, setCityOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState("");

  const uniqueCities = useMemo(() => dedupeCitiesForCatalog(cities), [cities]);
  const selectedCity = uniqueCities.find((city) => city.slug === citySlug);
  const filteredCities = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return uniqueCities;
    return uniqueCities.filter((city) => city.name.toLowerCase().includes(q));
  }, [uniqueCities, cityQuery]);

  function handleSearch() {
    const filters = getDefaultExcursionCatalogFilters({
      query: query.trim(),
      citySlug,
    });
    const params = excursionFiltersToSearchParams(filters);
    const suffix = params.toString();
    router.push(suffix ? `/excursions?${suffix}` : "/excursions");
  }

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
      <div className="flex min-w-0 flex-1 items-center rounded-2xl transition-colors hover:bg-gray-50">
        <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 lg:py-4">
          <Search className="h-5 w-5 shrink-0 text-sky" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate">{t("home.search.excursions.queryLabel")}</p>
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("excursions.searchPlaceholder")}
              className="h-auto border-0 bg-transparent p-0 text-sm font-medium text-charcoal shadow-none placeholder:font-normal placeholder:text-slate focus-visible:ring-0"
            />
          </div>
          {query.trim() ? (
            <ClearButton onClick={() => setQuery("")} label="Очистить поиск" />
          ) : null}
        </div>
      </div>

      <div className="hidden w-px bg-gray-200 lg:block" />

      <Popover open={cityOpen} onOpenChange={setCityOpen}>
        <div className="flex flex-1 items-center rounded-2xl transition-colors hover:bg-gray-50 lg:max-w-[280px]">
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left lg:py-4"
            >
              <MapPin className="h-5 w-5 shrink-0 text-sky" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate">{t("home.search.excursions.cityLabel")}</p>
                <p className="truncate text-sm font-medium text-charcoal">
                  {selectedCity?.name ?? t("home.search.excursions.cityAll")}
                </p>
              </div>
            </button>
          </PopoverTrigger>
          {citySlug ? (
            <ClearButton
              onClick={() => {
                setCitySlug("");
                setCityOpen(false);
              }}
              label="Сбросить город"
            />
          ) : null}
        </div>
        <PopoverContent className="w-[min(100vw-2rem,320px)] p-0" align="start">
          <div className="border-b border-gray-100 p-3">
            <Input
              value={cityQuery}
              onChange={(event) => setCityQuery(event.target.value)}
              placeholder={t("home.search.excursions.cityPlaceholder")}
              className="h-9"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto p-2">
            <li>
              <button
                type="button"
                onClick={() => {
                  setCitySlug("");
                  setCityOpen(false);
                }}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-50",
                  !citySlug && "bg-sky/10 font-medium text-sky",
                )}
              >
                {t("home.search.excursions.cityAll")}
              </button>
            </li>
            {filteredCities.map((city) => (
              <li key={city.slug}>
                <button
                  type="button"
                  onClick={() => {
                    setCitySlug(city.slug);
                    setCityOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-50",
                    citySlug === city.slug && "bg-sky/10 font-medium text-sky",
                  )}
                >
                  <span>{city.name}</span>
                  <span className="text-xs text-slate">{city.experienceCount}</span>
                </button>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        size="lg"
        className="h-auto rounded-2xl px-8 py-4 text-base lg:min-w-[200px]"
        onClick={handleSearch}
      >
        {t("home.search.excursions.submit")}
      </Button>
    </div>
  );
}
