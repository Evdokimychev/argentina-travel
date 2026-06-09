"use client";

import { useState, useEffect } from "react";
import { TourFilters } from "@/types";
import {
  ACCOMMODATION_OPTIONS,
  COMFORT_OPTIONS,
  DIFFICULTY_OPTIONS,
  LANGUAGE_OPTIONS,
  CHILDREN_OPTIONS,
  GROUP_SIZE_OPTIONS,
} from "@/data/filters";
import { FilterPopover, FilterFooter, CheckboxList } from "./FilterPopover";
import ActivityTypesFilter from "./ActivityTypesFilter";
import DurationFilter from "./DurationFilter";
import FilterScrollRow from "./FilterScrollRow";
import { isDurationFilterActive } from "@/data/duration-presets";
import PriceFilterFields, { usePriceFilterLimits } from "./PriceFilterFields";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";

interface FilterBarProps {
  filters: TourFilters;
  onChange: (filters: TourFilters) => void;
  /** Hide filters shown in the catalog sidebar */
  exclude?: ("activities" | "price" | "duration" | "difficulty" | "comfort")[];
}

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

export default function FilterBar({ filters, onChange, exclude = [] }: FilterBarProps) {
  const { currency } = useLocaleCurrency();
  const { priceMax } = usePriceFilterLimits();
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  useEffect(() => {
    setDraft((d) => ({
      ...d,
      priceMin: 0,
      priceMax: priceMax,
    }));
  }, [currency, priceMax]);

  const apply = () => onChange({ ...draft, priceMax: draft.priceMax || priceMax });
  const patch = (p: Partial<TourFilters>) => setDraft((d) => ({ ...d, ...p }));

  const effectiveMax = draft.priceMax || priceMax;
  const priceActive = draft.priceMin > 0 || effectiveMax < priceMax;

  const hidden = new Set(exclude);

  return (
    <FilterScrollRow>
      {!hidden.has("activities") && (
      <FilterPopover
        label="Виды отдыха"
        active={draft.activityTypes.length > 0}
        width="min-w-[520px] max-w-[560px]"
      >
        <ActivityTypesFilter
          selected={draft.activityTypes}
          onToggle={(item) =>
            patch({ activityTypes: toggle(draft.activityTypes, item) })
          }
          onClear={() => patch({ activityTypes: [] })}
          onApply={apply}
        />
      </FilterPopover>
      )}

      {!hidden.has("price") && (
      <FilterPopover label="Цена" active={priceActive}>
        <div className="p-4">
          <PriceFilterFields
            priceMin={draft.priceMin}
            priceMax={draft.priceMax}
            onChange={(p) => patch(p)}
          />
        </div>
        <FilterFooter
          onClear={() => patch({ priceMin: 0, priceMax: priceMax })}
          onApply={apply}
        />
      </FilterPopover>
      )}

      {!hidden.has("duration") && (
      <FilterPopover
        label="Продолжительность"
        active={isDurationFilterActive(draft)}
        width="min-w-[340px]"
      >
        <DurationFilter
          durationMin={draft.durationMin}
          durationMax={draft.durationMax}
          dayTripsOnly={draft.dayTripsOnly}
          selectedPresets={draft.durations}
          onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
          onClear={() =>
            patch({
              durationMin: null,
              durationMax: null,
              dayTripsOnly: false,
              durations: [],
            })
          }
          onApply={apply}
        />
      </FilterPopover>
      )}

      <FilterPopover label="Проживание" active={draft.accommodations.length > 0}>
        <CheckboxList
          items={ACCOMMODATION_OPTIONS}
          selected={draft.accommodations}
          onToggle={(item) =>
            patch({ accommodations: toggle(draft.accommodations, item as typeof draft.accommodations[0]) })
          }
        />
        <FilterFooter onClear={() => patch({ accommodations: [] })} onApply={apply} />
      </FilterPopover>

      {!hidden.has("comfort") && (
      <FilterPopover label="Комфорт" active={draft.comfortLevels.length > 0}>
        <CheckboxList
          items={COMFORT_OPTIONS}
          selected={draft.comfortLevels}
          onToggle={(item) =>
            patch({ comfortLevels: toggle(draft.comfortLevels, item as typeof draft.comfortLevels[0]) })
          }
          withDescription
        />
        <FilterFooter onClear={() => patch({ comfortLevels: [] })} onApply={apply} />
      </FilterPopover>
      )}

      {!hidden.has("difficulty") && (
      <FilterPopover label="Нагрузка" active={draft.difficultyLevels.length > 0}>
        <CheckboxList
          items={DIFFICULTY_OPTIONS}
          selected={draft.difficultyLevels}
          onToggle={(item) =>
            patch({ difficultyLevels: toggle(draft.difficultyLevels, item as typeof draft.difficultyLevels[0]) })
          }
          withDescription
        />
        <FilterFooter onClear={() => patch({ difficultyLevels: [] })} onApply={apply} />
      </FilterPopover>
      )}

      <FilterPopover label="Язык" active={draft.languages.length > 0}>
        <CheckboxList
          items={LANGUAGE_OPTIONS}
          selected={draft.languages}
          onToggle={(item) =>
            patch({ languages: toggle(draft.languages, item as typeof draft.languages[0]) })
          }
        />
        <FilterFooter onClear={() => patch({ languages: [] })} onApply={apply} />
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
          onClear={() => patch({ childrenPolicy: null })}
          onApply={apply}
        />
      </FilterPopover>

      <FilterPopover label="Группа" active={draft.groupSizes.length > 0}>
        <CheckboxList
          items={GROUP_SIZE_OPTIONS}
          selected={draft.groupSizes}
          onToggle={(item) =>
            patch({ groupSizes: toggle(draft.groupSizes, item as typeof draft.groupSizes[0]) })
          }
        />
        <FilterFooter onClear={() => patch({ groupSizes: [] })} onApply={apply} />
      </FilterPopover>
    </FilterScrollRow>
  );
}
