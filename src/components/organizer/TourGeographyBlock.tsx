"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  TOUR_CITY_OPTIONS,
  TOUR_COUNTRY_OPTIONS,
  TOUR_LANDMARK_OPTIONS,
  TOURIST_REGION_OPTIONS,
} from "@/data/tour-geography";
import { cn } from "@/lib/cn";

function toggleItem<T>(items: T[], item: T): T[] {
  return items.includes(item) ? items.filter((value) => value !== item) : [...items, item];
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-charcoal">
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="text-slate transition-colors hover:text-charcoal"
        aria-label={`Убрать ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function MultiSelectField({
  label,
  required,
  placeholder,
  options,
  selected,
  onChange,
}: {
  label: string;
  required?: boolean;
  placeholder: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative flex min-h-14 w-full items-start justify-between gap-2 rounded-2xl border border-gray-200 bg-white px-3 pb-2.5 pt-6 text-left transition-colors hover:border-gray-300"
        >
          <span className="absolute left-3 top-2 text-[11px] font-medium text-slate">
            {label}
            {required ? " *" : ""}
          </span>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 pt-0.5">
            {selected.length ? (
              selected.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  onRemove={() => onChange(selected.filter((value) => value !== item))}
                />
              ))
            ) : (
              <span className="text-sm text-slate">{placeholder}</span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1 self-center">
            {selected.length ? (
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  onChange([]);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    onChange([]);
                  }
                }}
                className="rounded p-0.5 text-slate transition-colors hover:text-charcoal"
                aria-label="Очистить"
              >
                <X className="h-4 w-4" />
              </span>
            ) : null}
            <ChevronDown
              className={cn("h-4 w-4 text-slate transition-transform", open && "rotate-180")}
            />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="min-w-[var(--radix-popover-trigger-width)] p-0">
        <ul className="max-h-72 overflow-y-auto p-1">
          {options.map((option) => {
            const active = selected.includes(option);
            return (
              <li key={option}>
                <button
                  type="button"
                  onClick={() => onChange(toggleItem(selected, option))}
                  className={cn(
                    "flex w-full rounded-xl px-2.5 py-2.5 text-left text-sm transition-colors",
                    active
                      ? "bg-gray-100 font-medium text-charcoal"
                      : "hover:bg-gray-50 text-charcoal"
                  )}
                >
                  {option}
                </button>
              </li>
            );
          })}
          <li className="border-t border-gray-100 p-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full rounded-xl px-2.5 py-2 text-sm font-medium text-brand hover:bg-brand-light/40"
            >
              Готово
            </button>
          </li>
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function SingleSelectField({
  label,
  required,
  placeholder,
  options,
  value,
  onChange,
  hint,
}: {
  label: string;
  required?: boolean;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (next: string) => void;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="relative flex min-h-14 w-full items-center justify-between gap-2 rounded-2xl border border-gray-200 bg-white px-3 pb-2.5 pt-6 text-left transition-colors hover:border-gray-300"
          >
            <span className="absolute left-3 top-2 text-[11px] font-medium text-slate">
              {label}
              {required ? " *" : ""}
            </span>
            <span className={cn("truncate pt-0.5 text-sm", value ? "text-charcoal" : "text-slate")}>
              {value || placeholder}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              {value ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    onChange("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.stopPropagation();
                      onChange("");
                    }
                  }}
                  className="rounded p-0.5 text-slate transition-colors hover:text-charcoal"
                  aria-label="Очистить"
                >
                  <X className="h-4 w-4" />
                </span>
              ) : null}
              <ChevronDown
                className={cn("h-4 w-4 text-slate transition-transform", open && "rotate-180")}
              />
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="min-w-[var(--radix-popover-trigger-width)] p-0">
          <ul className="max-h-72 overflow-y-auto p-1">
            {options.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full rounded-xl px-2.5 py-2.5 text-left text-sm transition-colors",
                    value === option
                      ? "bg-gray-100 font-medium text-charcoal"
                      : "hover:bg-gray-50 text-charcoal"
                  )}
                >
                  {option}
                </button>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-slate">{hint}</p> : null}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <label className="absolute left-3 top-2 text-[11px] font-medium text-slate">{label}</label>
      <div className="relative flex min-h-14 items-center rounded-2xl border border-gray-200 bg-white px-3 pb-2.5 pt-6">
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent pr-8 text-sm text-charcoal outline-none placeholder:text-slate"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate transition-colors hover:text-charcoal"
            aria-label="Очистить"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export interface TourGeographyValues {
  countries: string[];
  cities: string[];
  mainLocation: string;
  touristRegions: string[];
  landmarks: string[];
  mapStartPoint: string;
}

interface TourGeographyBlockProps extends TourGeographyValues {
  onChange: (patch: Partial<TourGeographyValues>) => void;
}

export default function TourGeographyBlock({
  countries,
  cities,
  mainLocation,
  touristRegions,
  landmarks,
  mapStartPoint,
  onChange,
}: TourGeographyBlockProps) {
  return (
    <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="font-display text-xl font-bold text-charcoal sm:text-2xl">География тура</h2>

      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-charcoal">
        Если вы не нашли свой регион, напишите в{" "}
        <a href="/contacts" className="font-medium text-brand hover:underline">
          чат поддержки
        </a>
        . Мы добавим его в течение 7 дней.
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <MultiSelectField
            label="Страны"
            required
            placeholder="Выберите страны"
            options={[...TOUR_COUNTRY_OPTIONS]}
            selected={countries}
            onChange={(next) => onChange({ countries: next })}
          />
          <MultiSelectField
            label="Города"
            placeholder="Выберите города"
            options={TOUR_CITY_OPTIONS}
            selected={cities}
            onChange={(next) => onChange({ cities: next })}
          />
          <SingleSelectField
            label="Основная локация тура"
            required
            placeholder="Выберите локацию"
            options={TOUR_CITY_OPTIONS}
            value={mainLocation}
            onChange={(next) => onChange({ mainLocation: next })}
            hint="Основная локация выводится в карточке тура в поиске. Тур приоритетно попадает в каталог по своей основной локации."
          />
        </div>

        <div className="space-y-4">
          <MultiSelectField
            label="Туристические регионы"
            placeholder="Выберите регионы"
            options={TOURIST_REGION_OPTIONS}
            selected={touristRegions}
            onChange={(next) => onChange({ touristRegions: next })}
          />
          <MultiSelectField
            label="Достопримечательности"
            placeholder="Выберите достопримечательности"
            options={TOUR_LANDMARK_OPTIONS}
            selected={landmarks}
            onChange={(next) => onChange({ landmarks: next })}
          />
        </div>
      </div>

      <div className="space-y-4 border-t border-gray-200/80 pt-5">
        <h3 className="font-display text-base font-bold text-charcoal">Где начинается</h3>
        <TextField
          label="Точка на карте"
          value={mapStartPoint}
          onChange={(next) => onChange({ mapStartPoint: next })}
          placeholder="Адрес или ориентир старта тура"
        />
      </div>
    </section>
  );
}
