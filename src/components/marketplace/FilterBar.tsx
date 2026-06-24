"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { TourFilters, TourListing, TourFormat } from "@/types";
import { CHILDREN_OPTIONS } from "@/data/filters";
import { pruneGroupSizes } from "@/data/group-format-options";
import { FilterPopover, FilterFooter } from "./FilterPopover";
import ActivityTypesFilter from "./ActivityTypesFilter";
import AccommodationFilter from "./AccommodationFilter";
import ComfortFilter from "./ComfortFilter";
import DifficultyFilter from "./DifficultyFilter";
import LanguageFilter from "./LanguageFilter";
import GroupFormatFilter, {
  groupFormatFilterLabel,
  isGroupFormatFilterActive,
} from "./GroupFormatFilter";
import DurationFilter from "./DurationFilter";
import FilterScrollRow from "./FilterScrollRow";
import { isDurationFilterActive } from "@/data/duration-presets";
import PriceFilterFields, { usePriceFilterLimits } from "./PriceFilterFields";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { isPriceFilterActive } from "@/lib/tour-price-bounds";
import {
  countToursByAccommodation,
  countToursByField,
  countToursByDurationBucket,
  countDayTripTours,
} from "@/lib/filter-counts";
import { resolveListingComfortLevel } from "@/lib/tour-accommodation";

interface FilterBarProps {
  tours: TourListing[];
  filters: TourFilters;
  onChange: (filters: TourFilters) => void;
}

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

export default function FilterBar({ tours, filters, onChange }: FilterBarProps) {
  const { currency } = useLocaleCurrency();
  const { priceMin: catalogMin, priceMax } = usePriceFilterLimits(tours);
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  const commit = useCallback(
    (patch?: Partial<TourFilters>) => {
      setDraft((d) => {
        const next = {
          ...d,
          ...patch,
          priceMax: (patch?.priceMax ?? d.priceMax) || priceMax,
        };
        onChange(next);
        return next;
      });
    },
    [onChange, priceMax]
  );

  const apply = useCallback(() => commit(), [commit]);

  const patch = useCallback(
    (p: Partial<TourFilters>) => setDraft((d) => ({ ...d, ...p })),
    []
  );

  const toggleDraft = useCallback(
    <K extends keyof TourFilters>(key: K, item: TourFilters[K] extends (infer U)[] ? U : never) => {
      setDraft((d) => ({
        ...d,
        [key]: toggle(d[key] as typeof item[], item),
      }));
    },
    []
  );

  const toggleFormat = useCallback((format: TourFormat) => {
    setDraft((d) => {
      const nextFormats = toggle(d.tourFormats, format);
      return {
        ...d,
        tourFormats: nextFormats,
        groupSizes: pruneGroupSizes(d.groupSizes, nextFormats),
      };
    });
  }, []);

  const accommodationCounts = useMemo(
    () => countToursByAccommodation(tours),
    [tours]
  );
  const activityCounts = useMemo(
    () => countToursByField(tours, (t) => t.activityType),
    [tours]
  );
  const comfortCounts = useMemo(
    () => countToursByField(tours, (t) => resolveListingComfortLevel(t)),
    [tours]
  );
  const difficultyCounts = useMemo(
    () => countToursByField(tours, (t) => t.difficultyLevel),
    [tours]
  );
  const languageCounts = useMemo(() => {
    const counts: Partial<Record<string, number>> = {};
    for (const tour of tours) {
      for (const lang of tour.language) {
        counts[lang] = (counts[lang] ?? 0) + 1;
      }
    }
    return counts;
  }, [tours]);
  const durationCounts = useMemo(
    () => countToursByDurationBucket(tours),
    [tours]
  );
  const dayTripsCount = useMemo(() => countDayTripTours(tours), [tours]);

  const priceActive = isPriceFilterActive(
    draft.priceMin,
    draft.priceMax,
    currency,
    tours
  );

  const groupFormatActive = isGroupFormatFilterActive(
    draft.tourFormats,
    draft.groupSizes
  );

  const groupFormatLabel = groupFormatFilterLabel(
    draft.tourFormats,
    draft.groupSizes
  );

  return (
    <FilterScrollRow>
      <FilterPopover
        label="Виды отдыха"
        active={draft.activityTypes.length > 0}
        width="sm:min-w-[520px] sm:max-w-[560px]"
      >
        <ActivityTypesFilter
          selected={draft.activityTypes}
          counts={activityCounts}
          onToggle={(item) => toggleDraft("activityTypes", item)}
          onClear={() => commit({ activityTypes: [] })}
          onApply={apply}
        />
      </FilterPopover>

      <FilterPopover label="Цена" active={priceActive}>
        <div className="p-4">
          <PriceFilterFields
            priceMin={draft.priceMin}
            priceMax={draft.priceMax}
            priceMinLimit={catalogMin}
            onChange={(p) => patch(p)}
          />
        </div>
        <FilterFooter
          onClear={() => commit({ priceMin: catalogMin, priceMax: priceMax })}
          onApply={apply}
          applyAfterClear={false}
        />
      </FilterPopover>

      <FilterPopover
        label="Продолжительность"
        active={isDurationFilterActive(draft)}
        width="sm:min-w-[340px]"
      >
        <DurationFilter
          durationMin={draft.durationMin}
          durationMax={draft.durationMax}
          dayTripsOnly={draft.dayTripsOnly}
          selectedPresets={draft.durations}
          dayTripsCount={dayTripsCount}
          counts={durationCounts}
          onChange={(updates) => setDraft((d) => ({ ...d, ...updates }))}
          onClear={() =>
            commit({
              durationMin: null,
              durationMax: null,
              dayTripsOnly: false,
              durations: [],
            })
          }
          onApply={apply}
        />
      </FilterPopover>

      <FilterPopover
        label="Проживание"
        active={draft.accommodations.length > 0}
        width="sm:min-w-[360px]"
      >
        <AccommodationFilter
          selected={draft.accommodations}
          counts={accommodationCounts}
          onToggle={(type) => toggleDraft("accommodations", type)}
          onClear={() => commit({ accommodations: [] })}
          onApply={apply}
        />
      </FilterPopover>

      <FilterPopover
        label="Комфорт"
        active={draft.comfortLevels.length > 0}
        width="sm:min-w-[360px]"
      >
        <ComfortFilter
          selected={draft.comfortLevels}
          counts={comfortCounts}
          onToggle={(level) => toggleDraft("comfortLevels", level)}
          onClear={() => commit({ comfortLevels: [] })}
          onApply={apply}
        />
      </FilterPopover>

      <FilterPopover
        label="Нагрузка"
        active={draft.difficultyLevels.length > 0}
        width="sm:min-w-[360px]"
      >
        <DifficultyFilter
          selected={draft.difficultyLevels}
          counts={difficultyCounts}
          onToggle={(level) => toggleDraft("difficultyLevels", level)}
          onClear={() => commit({ difficultyLevels: [] })}
          onApply={apply}
        />
      </FilterPopover>

      <FilterPopover
        label="Язык"
        active={draft.languages.length > 0}
        width="sm:min-w-[360px]"
      >
        <LanguageFilter
          selected={draft.languages}
          counts={languageCounts}
          onToggle={(lang) => toggleDraft("languages", lang)}
          onClear={() => commit({ languages: [] })}
          onApply={apply}
        />
      </FilterPopover>

      <FilterPopover label="С детьми" active={!!draft.childrenPolicy}>
        <ul className="p-2">
          {CHILDREN_OPTIONS.map((opt) => (
            <li key={opt}>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 hover:bg-gray-50">
                <input
                  type="radio"
                  name="children"
                  checked={draft.childrenPolicy === opt}
                  onChange={() => patch({ childrenPolicy: opt })}
                  className="h-4 w-4 accent-brand"
                />
                <span className="text-sm text-charcoal">{opt}</span>
              </label>
            </li>
          ))}
        </ul>
        <FilterFooter
          onClear={() => commit({ childrenPolicy: null })}
          onApply={apply}
          applyAfterClear={false}
        />
      </FilterPopover>

      <FilterPopover
        label={groupFormatLabel}
        active={groupFormatActive}
        width="sm:min-w-[400px]"
      >
        <GroupFormatFilter
          tours={tours}
          selectedFormats={draft.tourFormats}
          selectedSizes={draft.groupSizes}
          onToggleFormat={toggleFormat}
          onToggleSize={(size) => toggleDraft("groupSizes", size)}
          onClear={() => commit({ tourFormats: [], groupSizes: [] })}
          onApply={apply}
        />
      </FilterPopover>

      <FilterPopover label="Мгновенная бронь" active={draft.instantBookingOnly}>
        <ul className="p-2">
          <li>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 hover:bg-gray-50">
              <input
                type="checkbox"
                checked={draft.instantBookingOnly}
                onChange={(event) => patch({ instantBookingOnly: event.target.checked })}
                className="h-4 w-4 accent-brand"
              />
              <span className="text-sm text-charcoal">Только с мгновенным бронированием</span>
            </label>
          </li>
        </ul>
        <FilterFooter
          onClear={() => commit({ instantBookingOnly: false })}
          onApply={apply}
          applyAfterClear={false}
        />
      </FilterPopover>
    </FilterScrollRow>
  );
}
