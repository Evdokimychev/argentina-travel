"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { PLACE_CATEGORIES, PLACE_CATEGORY_LABELS } from "@/types/place";
import type { PlaceCatalogFilters, PlaceSortOption } from "@/types/place";
import { countActivePlaceFilters } from "@/lib/places-catalog-filters";
import { cn } from "@/lib/cn";

type PlaceSearchPanelProps = {
  filters: PlaceCatalogFilters;
  regions: string[];
  provinces: string[];
  onChange: (filters: PlaceCatalogFilters) => void;
  onReset: () => void;
  labels: {
    searchPlaceholder: string;
    categoryLabel: string;
    categoryAll: string;
    regionLabel: string;
    regionAll: string;
    provinceLabel: string;
    provinceAll: string;
    sortLabel: string;
    sortPopular: string;
    sortRating: string;
    sortNameAsc: string;
    sortNameDesc: string;
    reset: string;
    filters: string;
  };
};

export default function PlaceSearchPanel({
  filters,
  regions,
  provinces,
  onChange,
  onReset,
  labels,
}: PlaceSearchPanelProps) {
  const activeCount = countActivePlaceFilters(filters);
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" aria-hidden />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            placeholder={labels.searchPlaceholder}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-charcoal shadow-sm outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
            showFilters || activeCount > 0
              ? "border-sky bg-sky/10 text-sky"
              : "border-gray-200 bg-white text-charcoal hover:border-gray-300",
          )}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          {labels.filters}
          {activeCount > 0 ? (
            <span className="rounded-full bg-sky px-1.5 py-0.5 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          ) : null}
        </button>
      </div>

      {showFilters ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-slate">{labels.categoryLabel}</span>
              <select
                value={filters.category}
                onChange={(e) =>
                  onChange({ ...filters, category: e.target.value as PlaceCatalogFilters["category"] })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">{labels.categoryAll}</option>
                {PLACE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {PLACE_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-slate">{labels.regionLabel}</span>
              <select
                value={filters.region}
                onChange={(e) => onChange({ ...filters, region: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">{labels.regionAll}</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-slate">{labels.provinceLabel}</span>
              <select
                value={filters.province}
                onChange={(e) => onChange({ ...filters, province: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">{labels.provinceAll}</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-slate">{labels.sortLabel}</span>
              <select
                value={filters.sort}
                onChange={(e) => onChange({ ...filters, sort: e.target.value as PlaceSortOption })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="popular">{labels.sortPopular}</option>
                <option value="rating">{labels.sortRating}</option>
                <option value="name_asc">{labels.sortNameAsc}</option>
                <option value="name_desc">{labels.sortNameDesc}</option>
              </select>
            </label>
          </div>

          {activeCount > 0 ? (
            <button
              type="button"
              onClick={onReset}
              className="mt-4 inline-flex items-center gap-1 text-sm text-sky hover:underline"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              {labels.reset}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
