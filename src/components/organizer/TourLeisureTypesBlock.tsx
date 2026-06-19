"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ClearFieldButton,
  FieldFloatingLabel,
  PopoverFieldTrigger,
  SelectionChip,
} from "@/components/organizer/OrganizerSelectFieldParts";
import { ACTIVITY_TYPE_OPTIONS } from "@/data/activity-icons";
import { TOUR_COLLECTION_OPTIONS, type TourCollection } from "@/data/tour-collections";
import { cn } from "@/lib/cn";
import type { ActivityType } from "@/types";

function toggleItem<T>(items: T[], item: T): T[] {
  return items.includes(item) ? items.filter((value) => value !== item) : [...items, item];
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
      <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">Виды отдыха</h2>

      <div className="max-w-md">
        <Popover open={mainOpen} onOpenChange={setMainOpen}>
          <PopoverTrigger asChild>
            <PopoverFieldTrigger>
              <FieldFloatingLabel>Основной тип тура</FieldFloatingLabel>
              <span className="truncate pt-0.5 text-sm text-charcoal">{activityType}</span>
              <div className="flex shrink-0 items-center gap-1">
                <ClearFieldButton onClear={() => onActivityTypeChange(mainOptions[0])} />
                <ChevronDown
                  className={cn("h-4 w-4 text-slate transition-transform", mainOpen && "rotate-180")}
                />
              </div>
            </PopoverFieldTrigger>
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
            <PopoverFieldTrigger align="start">
              <FieldFloatingLabel>Активности в туре</FieldFloatingLabel>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 pt-0.5">
                {tourActivities.length ? (
                  tourActivities.map((activity) => (
                    <SelectionChip
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
                  <ClearFieldButton onClear={() => onTourActivitiesChange([])} />
                ) : null}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-slate transition-transform",
                    activitiesOpen && "rotate-180"
                  )}
                />
              </div>
            </PopoverFieldTrigger>
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
            <PopoverFieldTrigger align="start">
              <FieldFloatingLabel>Подборки</FieldFloatingLabel>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 pt-0.5">
                {collections.length ? (
                  collections.map((collection) => (
                    <SelectionChip
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
                  <ClearFieldButton onClear={() => onCollectionsChange([])} />
                ) : null}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-slate transition-transform",
                    collectionsOpen && "rotate-180"
                  )}
                />
              </div>
            </PopoverFieldTrigger>
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
