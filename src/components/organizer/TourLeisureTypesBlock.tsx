"use client";

import { useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ACTIVITY_TYPE_OPTIONS } from "@/data/activity-icons";
import { TOUR_COLLECTION_OPTIONS, type TourCollection } from "@/data/tour-collections";
import { cn } from "@/lib/cn";
import type { ActivityType } from "@/types";

function toggleItem<T>(items: T[], item: T): T[] {
  return items.includes(item) ? items.filter((value) => value !== item) : [...items, item];
}

function Chip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
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

function ActivityOptionList({
  selected,
  onToggle,
  onClose,
}: {
  selected: ActivityType[];
  onToggle: (type: ActivityType) => void;
  onClose: () => void;
}) {
  return (
    <ul className="max-h-72 overflow-y-auto p-1">
      {ACTIVITY_TYPE_OPTIONS.map(({ type, icon: Icon }) => {
        const active = selected.includes(type);
        return (
          <li key={type}>
            <button
              type="button"
              onClick={() => onToggle(type)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm transition-colors",
                active ? "bg-gray-100 font-medium text-charcoal" : "hover:bg-gray-50 text-charcoal"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0 stroke-[1.75]" aria-hidden />
              {type}
            </button>
          </li>
        );
      })}
      <li className="border-t border-gray-100 p-1">
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl px-2.5 py-2 text-sm font-medium text-brand hover:bg-brand-light/40"
        >
          Готово
        </button>
      </li>
    </ul>
  );
}

function CollectionOptionList({
  selected,
  onToggle,
  onClose,
}: {
  selected: TourCollection[];
  onToggle: (collection: TourCollection) => void;
  onClose: () => void;
}) {
  return (
    <ul className="max-h-72 overflow-y-auto p-1">
      {TOUR_COLLECTION_OPTIONS.map(({ label }) => {
        const active = selected.includes(label);
        return (
          <li key={label}>
            <button
              type="button"
              onClick={() => onToggle(label)}
              className={cn(
                "flex w-full items-center rounded-xl px-2.5 py-2.5 text-left text-sm transition-colors",
                active ? "bg-gray-100 font-medium text-charcoal" : "hover:bg-gray-50 text-charcoal"
              )}
            >
              {label}
            </button>
          </li>
        );
      })}
      <li className="border-t border-gray-100 p-1">
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl px-2.5 py-2 text-sm font-medium text-brand hover:bg-brand-light/40"
        >
          Готово
        </button>
      </li>
    </ul>
  );
}

interface TourLeisureTypesBlockProps {
  activityType: ActivityType;
  tourActivities: ActivityType[];
  collections: TourCollection[];
  onActivityTypeChange: (type: ActivityType) => void;
  onTourActivitiesChange: (activities: ActivityType[]) => void;
  onCollectionsChange: (collections: TourCollection[]) => void;
}

export default function TourLeisureTypesBlock({
  activityType,
  tourActivities,
  collections,
  onActivityTypeChange,
  onTourActivitiesChange,
  onCollectionsChange,
}: TourLeisureTypesBlockProps) {
  const [mainOpen, setMainOpen] = useState(false);
  const [activitiesOpen, setActivitiesOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);

  const mainOptions = useMemo(() => ACTIVITY_TYPE_OPTIONS.map((option) => option.type), []);

  return (
    <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="font-display text-xl font-bold text-charcoal sm:text-2xl">Виды отдыха</h2>

      <div className="max-w-md">
          <Popover open={mainOpen} onOpenChange={setMainOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="relative flex min-h-14 w-full items-center justify-between gap-2 rounded-2xl border border-gray-200 bg-white px-3 pb-2.5 pt-6 text-left transition-colors hover:border-gray-300"
              >
                <span className="absolute left-3 top-2 text-[11px] font-medium text-slate">
                  Основной тип тура
                </span>
                <span className="truncate pt-0.5 text-sm text-charcoal">{activityType}</span>
                <div className="flex shrink-0 items-center gap-1">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      onActivityTypeChange(mainOptions[0]);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        onActivityTypeChange(mainOptions[0]);
                      }
                    }}
                    className="rounded p-0.5 text-slate transition-colors hover:text-charcoal"
                    aria-label="Очистить"
                  >
                    <X className="h-4 w-4" />
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-slate transition-transform",
                      mainOpen && "rotate-180"
                    )}
                  />
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="min-w-[var(--radix-popover-trigger-width)] p-0">
              <ul className="max-h-72 overflow-y-auto p-1">
                {ACTIVITY_TYPE_OPTIONS.map(({ type, icon: Icon }) => (
                  <li key={type}>
                    <button
                      type="button"
                      onClick={() => {
                        onActivityTypeChange(type);
                        setMainOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm transition-colors",
                        activityType === type
                          ? "bg-gray-100 font-medium text-charcoal"
                          : "hover:bg-gray-50 text-charcoal"
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0 stroke-[1.75]" aria-hidden />
                      {type}
                    </button>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
          <p className="mt-1.5 text-xs leading-relaxed text-slate">
            Отображается в карточке тура в каталоге
          </p>
        </div>

      <div className="relative">
        <Popover open={activitiesOpen} onOpenChange={setActivitiesOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="relative flex min-h-14 w-full items-start justify-between gap-2 rounded-2xl border border-gray-200 bg-white px-3 pb-2.5 pt-6 text-left transition-colors hover:border-gray-300"
            >
              <span className="absolute left-3 top-2 text-[11px] font-medium text-slate">
                Активности в туре
              </span>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 pt-0.5">
                {tourActivities.length ? (
                  tourActivities.map((activity) => (
                    <Chip
                      key={activity}
                      label={activity}
                      onRemove={() =>
                        onTourActivitiesChange(tourActivities.filter((item) => item !== activity))
                      }
                    />
                  ))
                ) : (
                  <span className="text-sm text-slate">Выберите активности</span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1 self-center">
                {tourActivities.length ? (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      onTourActivitiesChange([]);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        onTourActivitiesChange([]);
                      }
                    }}
                    className="rounded p-0.5 text-slate transition-colors hover:text-charcoal"
                    aria-label="Очистить"
                  >
                    <X className="h-4 w-4" />
                  </span>
                ) : null}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-slate transition-transform",
                    activitiesOpen && "rotate-180"
                  )}
                />
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="min-w-[var(--radix-popover-trigger-width)] p-0">
            <ActivityOptionList
              selected={tourActivities}
              onToggle={(type) => onTourActivitiesChange(toggleItem(tourActivities, type))}
              onClose={() => setActivitiesOpen(false)}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="relative">
        <Popover open={collectionsOpen} onOpenChange={setCollectionsOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="relative flex min-h-14 w-full items-start justify-between gap-2 rounded-2xl border border-gray-200 bg-white px-3 pb-2.5 pt-6 text-left transition-colors hover:border-gray-300"
            >
              <span className="absolute left-3 top-2 text-[11px] font-medium text-slate">
                Подборки
              </span>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 pt-0.5">
                {collections.length ? (
                  collections.map((collection) => (
                    <Chip
                      key={collection}
                      label={collection}
                      onRemove={() =>
                        onCollectionsChange(collections.filter((item) => item !== collection))
                      }
                    />
                  ))
                ) : (
                  <span className="text-sm text-slate">Выберите подборки</span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1 self-center">
                {collections.length ? (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      onCollectionsChange([]);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        onCollectionsChange([]);
                      }
                    }}
                    className="rounded p-0.5 text-slate transition-colors hover:text-charcoal"
                    aria-label="Очистить"
                  >
                    <X className="h-4 w-4" />
                  </span>
                ) : null}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-slate transition-transform",
                    collectionsOpen && "rotate-180"
                  )}
                />
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="min-w-[var(--radix-popover-trigger-width)] p-0">
            <CollectionOptionList
              selected={collections}
              onToggle={(collection) => onCollectionsChange(toggleItem(collections, collection))}
              onClose={() => setCollectionsOpen(false)}
            />
          </PopoverContent>
        </Popover>
      </div>
    </section>
  );
}
