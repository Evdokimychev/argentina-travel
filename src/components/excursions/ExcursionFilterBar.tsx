"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import FilterScrollRow from "@/components/marketplace/FilterScrollRow";
import { FilterFooter, FilterPopover } from "@/components/marketplace/FilterPopover";
import { Slider } from "@/components/ui/slider";
import {
  EXCURSION_DURATION_OPTIONS,
  sanitizeExcursionMaxPrice,
  type ExcursionCatalogFilters,
  type ExcursionDurationBucket,
} from "@/lib/excursion-catalog-filters";
import { cn } from "@/lib/cn";
import type { ExcursionFormatKind, ExcursionPartner } from "@/types/excursion";

type ExcursionFilterBarProps = {
  filters: ExcursionCatalogFilters;
  priceMax: number;
  hasUsdPrices: boolean;
  onChange: (filters: ExcursionCatalogFilters) => void;
  inline?: boolean;
};

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((value) => value !== item) : [...arr, item];
}

export default function ExcursionFilterBar({
  filters,
  priceMax,
  hasUsdPrices,
  onChange,
  inline = false,
}: ExcursionFilterBarProps) {
  const [draft, setDraft] = useState(filters);

  const sliderMax = Math.max(50, priceMax);

  useEffect(() => {
    setDraft({
      ...filters,
      maxPrice: sanitizeExcursionMaxPrice(filters.maxPrice, sliderMax),
    });
  }, [filters, sliderMax]);

  const commit = useCallback(
    (next?: ExcursionCatalogFilters) => {
      const payload = next ?? draft;
      onChange({
        ...payload,
        maxPrice: sanitizeExcursionMaxPrice(payload.maxPrice, sliderMax),
      });
    },
    [draft, onChange, sliderMax],
  );

  const formatLabel = useMemo(() => {
    if (draft.formats.length === 0) return "Формат";
    if (draft.formats.length === 1) {
      return draft.formats[0] === "individual" ? "Индивидуальная" : "Групповая";
    }
    return `Формат · ${draft.formats.length}`;
  }, [draft.formats]);

  const durationLabel = useMemo(() => {
    if (draft.durationBuckets.length === 0) return "Длительность";
    if (draft.durationBuckets.length === 1) {
      return EXCURSION_DURATION_OPTIONS.find((option) => option.id === draft.durationBuckets[0])?.label ?? "Длительность";
    }
    return `Длительность · ${draft.durationBuckets.length}`;
  }, [draft.durationBuckets]);

  const ratingLabel =
    draft.minRating == null ? "Рейтинг" : `От ${draft.minRating.toFixed(1)}★`;

  const priceLabel =
    draft.maxPrice != null ? `До $${draft.maxPrice}` : "Цена";

  const partnerLabel = useMemo(() => {
    if (draft.partners.length === 0) return "Партнёр";
    if (draft.partners.length === 1) {
      return draft.partners[0] === "sputnik8" ? "Sputnik8" : "Tripster";
    }
    return `Партнёр · ${draft.partners.length}`;
  }, [draft.partners]);

  const sliderStep = sliderMax <= 150 ? 5 : 10;

  const filterBody = (
    <>
      <FilterPopover label={formatLabel} active={draft.formats.length > 0} width="min-w-[280px]" inline={inline}>
        <div className="p-4">
          <p className="text-sm font-semibold text-charcoal">Формат экскурсии</p>
          <div className="mt-3 space-y-2">
            {(
              [
                { id: "group" as ExcursionFormatKind, label: "Групповая", hint: "С другими путешественниками" },
                { id: "individual" as ExcursionFormatKind, label: "Индивидуальная", hint: "Только ваша компания" },
              ] as const
            ).map((option) => (
              <label
                key={option.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition",
                  draft.formats.includes(option.id)
                    ? "border-sky/30 bg-sky/5"
                    : "border-gray-100 hover:border-gray-200",
                )}
              >
                <input
                  type="checkbox"
                  checked={draft.formats.includes(option.id)}
                  onChange={() =>
                    setDraft((current) => ({
                      ...current,
                      formats: toggle(current.formats, option.id),
                    }))
                  }
                  className="mt-1 accent-sky"
                />
                <span>
                  <span className="block text-sm font-medium text-charcoal">{option.label}</span>
                  <span className="block text-xs text-slate">{option.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <FilterFooter
          onClear={() => setDraft((current) => ({ ...current, formats: [] }))}
          onApply={() => commit()}
        />
      </FilterPopover>

      <FilterPopover label={durationLabel} active={draft.durationBuckets.length > 0} width="min-w-[300px]" inline={inline}>
        <div className="p-4">
          <p className="text-sm font-semibold text-charcoal">Длительность</p>
          <div className="mt-3 space-y-2">
            {EXCURSION_DURATION_OPTIONS.map((option) => (
              <label
                key={option.id}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition",
                  draft.durationBuckets.includes(option.id)
                    ? "border-sky/30 bg-sky/5"
                    : "border-gray-100 hover:border-gray-200",
                )}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={draft.durationBuckets.includes(option.id)}
                    onChange={() =>
                      setDraft((current) => ({
                        ...current,
                        durationBuckets: toggle(current.durationBuckets, option.id as ExcursionDurationBucket),
                      }))
                    }
                    className="accent-sky"
                  />
                  <span className="text-sm font-medium text-charcoal">{option.label}</span>
                </span>
                <span className="text-xs text-slate">{option.hint}</span>
              </label>
            ))}
          </div>
        </div>
        <FilterFooter
          onClear={() => setDraft((current) => ({ ...current, durationBuckets: [] }))}
          onApply={() => commit()}
        />
      </FilterPopover>

      <FilterPopover label={ratingLabel} active={draft.minRating != null} width="min-w-[260px]" inline={inline}>
        <div className="p-4">
          <p className="text-sm font-semibold text-charcoal">Минимальный рейтинг</p>
          <div className="mt-3 space-y-2">
            {[4.5, 4.0, 3.5].map((rating) => (
              <label
                key={rating}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition",
                  draft.minRating === rating
                    ? "border-sky/30 bg-sky/5 font-medium text-charcoal"
                    : "border-gray-100 hover:border-gray-200",
                )}
              >
                <input
                  type="radio"
                  name="excursion-min-rating"
                  checked={draft.minRating === rating}
                  onChange={() => setDraft((current) => ({ ...current, minRating: rating }))}
                  className="accent-sky"
                />
                От {rating.toFixed(1)} ★ и выше
              </label>
            ))}
          </div>
        </div>
        <FilterFooter
          onClear={() => setDraft((current) => ({ ...current, minRating: null }))}
          onApply={() => commit()}
        />
      </FilterPopover>

      {hasUsdPrices ? (
        <FilterPopover label={priceLabel} active={draft.maxPrice != null} width="min-w-[320px]" inline={inline}>
          <div className="p-4">
            <p className="text-sm font-semibold text-charcoal">Максимальная цена</p>
            <p className="mt-1 text-xs text-slate">USD за человека или экскурсию — по данным партнёра</p>
            <div className="mt-4">
              <Slider
                min={0}
                max={sliderMax}
                step={sliderStep}
                value={[draft.maxPrice ?? sliderMax]}
                onValueChange={([value]) =>
                  setDraft((current) => ({
                    ...current,
                    maxPrice: value >= sliderMax ? null : value,
                  }))
                }
              />
              <p className="mt-2 text-sm font-medium text-charcoal">
                {draft.maxPrice != null ? `До $${draft.maxPrice}` : "Без ограничения"}
              </p>
            </div>
          </div>
          <FilterFooter
            onClear={() => setDraft((current) => ({ ...current, maxPrice: null }))}
            onApply={() => commit()}
          />
        </FilterPopover>
      ) : null}

      <FilterPopover label={partnerLabel} active={draft.partners.length > 0} width="min-w-[260px]" inline={inline}>
        <div className="p-4">
          <p className="text-sm font-semibold text-charcoal">Площадка партнёра</p>
          <div className="mt-3 space-y-2">
            {(
              [
                { id: "tripster" as ExcursionPartner, label: "Tripster" },
                { id: "sputnik8" as ExcursionPartner, label: "Sputnik8" },
              ] as const
            ).map((option) => (
              <label
                key={option.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition",
                  draft.partners.includes(option.id)
                    ? "border-sky/30 bg-sky/5 font-medium text-charcoal"
                    : "border-gray-100 hover:border-gray-200",
                )}
              >
                <input
                  type="checkbox"
                  checked={draft.partners.includes(option.id)}
                  onChange={() =>
                    setDraft((current) => ({
                      ...current,
                      partners: toggle(current.partners, option.id),
                    }))
                  }
                  className="accent-sky"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
        <FilterFooter
          onClear={() => setDraft((current) => ({ ...current, partners: [] }))}
          onApply={() => commit()}
        />
      </FilterPopover>
    </>
  );

  if (inline) {
    return <div className="flex max-w-full flex-col gap-2">{filterBody}</div>;
  }

  return <FilterScrollRow className="min-w-0 flex-1">{filterBody}</FilterScrollRow>;
}
