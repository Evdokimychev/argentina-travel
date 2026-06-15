"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { EsimDataFilter, EsimOfferFilters } from "@/lib/airalo/offer-meta";

type FilterOptions = {
  dataGb: number[];
  validityDays: number[];
  planTypes: string[];
  hasUnlimited: boolean;
  hasLimited: boolean;
};

type EsimCatalogFiltersProps = {
  filters: EsimOfferFilters;
  options: FilterOptions;
  onChange: (filters: EsimOfferFilters) => void;
  labels: {
    dataType: string;
    all: string;
    unlimited: string;
    limited: string;
    dataVolume: string;
    validity: string;
    planType: string;
    days: string;
    reset: string;
  };
  className?: string;
};

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-sm transition",
        active
          ? "border-sky bg-sky/10 font-medium text-sky"
          : "border-gray-200 bg-white text-slate hover:border-sky/40 hover:text-charcoal"
      )}
    >
      {children}
    </button>
  );
}

function hasActiveFilters(filters: EsimOfferFilters): boolean {
  return (
    (filters.dataType != null && filters.dataType !== "all") ||
    filters.dataGb != null ||
    filters.validityDays != null ||
    filters.planType != null
  );
}

export default function EsimCatalogFilters({
  filters,
  options,
  onChange,
  labels,
  className,
}: EsimCatalogFiltersProps) {
  const dataType = filters.dataType ?? "all";

  function setDataType(next: EsimDataFilter) {
    onChange({
      ...filters,
      dataType: next,
      dataGb: next === "unlimited" ? undefined : filters.dataGb,
    });
  }

  return (
    <div className={cn("space-y-4 rounded-2xl border border-gray-100 bg-white p-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-charcoal">{labels.dataType}</p>
        {hasActiveFilters(filters) ? (
          <button
            type="button"
            onClick={() => onChange({ dataType: "all" })}
            className="text-sm text-sky hover:underline"
          >
            {labels.reset}
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={dataType === "all"} onClick={() => setDataType("all")}>
          {labels.all}
        </FilterChip>
        {options.hasLimited ? (
          <FilterChip active={dataType === "limited"} onClick={() => setDataType("limited")}>
            {labels.limited}
          </FilterChip>
        ) : null}
        {options.hasUnlimited ? (
          <FilterChip active={dataType === "unlimited"} onClick={() => setDataType("unlimited")}>
            {labels.unlimited}
          </FilterChip>
        ) : null}
      </div>

      {options.dataGb.length > 0 && dataType !== "unlimited" ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-charcoal">{labels.dataVolume}</p>
          <div className="flex flex-wrap gap-2">
            {options.dataGb.map((gb) => (
              <FilterChip
                key={gb}
                active={filters.dataGb === gb}
                onClick={() =>
                  onChange({
                    ...filters,
                    dataGb: filters.dataGb === gb ? undefined : gb,
                    dataType: filters.dataType === "unlimited" ? "limited" : filters.dataType,
                  })
                }
              >
                {gb} GB
              </FilterChip>
            ))}
          </div>
        </div>
      ) : null}

      {options.validityDays.length > 1 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-charcoal">{labels.validity}</p>
          <div className="flex flex-wrap gap-2">
            {options.validityDays.map((days) => (
              <FilterChip
                key={days}
                active={filters.validityDays === days}
                onClick={() =>
                  onChange({
                    ...filters,
                    validityDays: filters.validityDays === days ? undefined : days,
                  })
                }
              >
                {days} {labels.days}
              </FilterChip>
            ))}
          </div>
        </div>
      ) : null}

      {options.planTypes.length > 1 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-charcoal">{labels.planType}</p>
          <div className="flex flex-wrap gap-2">
            {options.planTypes.map((planType) => (
              <FilterChip
                key={planType}
                active={filters.planType === planType}
                onClick={() =>
                  onChange({
                    ...filters,
                    planType: filters.planType === planType ? undefined : planType,
                  })
                }
              >
                {planType}
              </FilterChip>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
