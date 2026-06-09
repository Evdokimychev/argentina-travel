"use client";

import { ActivityType, ComfortLevel, DifficultyLevel, DurationBucket, TourFilters } from "@/types";
import { DURATION_PRESETS, rangeFromPresets } from "@/data/duration-presets";
import { DIFFICULTY_LEVELS, COMFORT_LEVELS, DIFFICULTY_DOT_COUNT, COMFORT_DOT_COUNT } from "@/data/tour-levels";
import { ACTIVITY_TYPE_OPTIONS } from "@/data/activity-icons";
import PriceFilterFields from "./PriceFilterFields";
import {
  SidebarSection,
  SidebarOption,
} from "./sidebar-filter-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  Banknote,
  CalendarRange,
  Mountain,
  BedDouble,
  Compass,
  Footprints,
  TrendingUp,
  MountainSnow,
  AlertTriangle,
  Tent,
  Bed,
  Hotel,
  Sparkles,
  Crown,
} from "lucide-react";

const SIDEBAR_ACTIVITY_TYPES: ActivityType[] = [
  "Экскурсионные туры",
  "Пешие туры",
  "Треккинг",
  "Винные туры",
  "Гастрономические туры",
  "Авторские туры",
];

const DURATION_SCALE: Record<DurationBucket, number> = {
  "1 день": 1,
  "2–3 дня": 2,
  "4–7 дней": 3,
  "8–14 дней": 4,
  "15+ дней": 5,
};

const DIFFICULTY_ICONS: Record<DifficultyLevel, typeof Footprints> = {
  Лёгкая: Footprints,
  Умеренная: TrendingUp,
  Средняя: Mountain,
  Высокая: MountainSnow,
  Экстремальная: AlertTriangle,
};

const COMFORT_ICONS: Record<ComfortLevel, typeof Tent> = {
  Базовый: Tent,
  Стандарт: Bed,
  Комфорт: Hotel,
  Премиум: Sparkles,
  Люкс: Crown,
};

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

interface CatalogSidebarProps {
  filters: TourFilters;
  onChange: (filters: TourFilters) => void;
  onReset: () => void;
  activeCount: number;
  className?: string;
}

export default function CatalogSidebar({
  filters,
  onChange,
  onReset,
  activeCount,
  className,
}: CatalogSidebarProps) {
  const patch = (p: Partial<TourFilters>) => onChange({ ...filters, ...p });

  function toggleDurationPreset(bucket: DurationBucket) {
    const next = toggle(filters.durations, bucket);
    if (next.length === 0) {
      patch({
        durationMin: null,
        durationMax: null,
        dayTripsOnly: false,
        durations: [],
      });
      return;
    }
    const { min, max } = rangeFromPresets(next);
    patch({
      durationMin: min,
      durationMax: max,
      dayTripsOnly: next.length === 1 && next[0] === "1 день",
      durations: next,
    });
  }

  const activityOptions = SIDEBAR_ACTIVITY_TYPES.map((type) => {
    const opt = ACTIVITY_TYPE_OPTIONS.find((o) => o.type === type);
    return { type, icon: opt?.icon };
  });

  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-100 bg-white p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 pb-2">
        <p className="text-sm font-semibold text-charcoal">Фильтры</p>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={onReset}>
            Сбросить
          </Button>
        )}
      </div>

      <SidebarSection title="Цена" icon={Banknote}>
        <div className="rounded-xl bg-gray-50/80 p-3">
          <PriceFilterFields
            priceMin={filters.priceMin}
            priceMax={filters.priceMax}
            onChange={(p) => patch(p)}
            showCurrencyHeader
          />
        </div>
      </SidebarSection>

      <SidebarSection title="Продолжительность" icon={CalendarRange}>
        <ul className="space-y-1 rounded-xl bg-sky/[0.04] p-1.5">
          {DURATION_PRESETS.map(({ bucket }) => (
            <li key={bucket}>
              <SidebarOption
                selected={filters.durations.includes(bucket)}
                onClick={() => toggleDurationPreset(bucket)}
                title={bucket}
                durationScale={DURATION_SCALE[bucket]}
              />
            </li>
          ))}
        </ul>
      </SidebarSection>

      <SidebarSection title="Нагрузка" icon={Mountain}>
        <ul className="space-y-1">
          {DIFFICULTY_LEVELS.map(({ level, description }) => (
            <li key={level}>
              <SidebarOption
                selected={filters.difficultyLevels.includes(level)}
                onClick={() =>
                  patch({
                    difficultyLevels: toggle(filters.difficultyLevels, level),
                  })
                }
                icon={DIFFICULTY_ICONS[level]}
                title={level}
                description={description}
                scale={DIFFICULTY_DOT_COUNT[level]}
              />
            </li>
          ))}
        </ul>
      </SidebarSection>

      <SidebarSection title="Комфорт" icon={BedDouble}>
        <ul className="space-y-1">
          {COMFORT_LEVELS.map(({ level, description }) => (
            <li key={level}>
              <SidebarOption
                selected={filters.comfortLevels.includes(level)}
                onClick={() =>
                  patch({
                    comfortLevels: toggle(filters.comfortLevels, level),
                  })
                }
                icon={COMFORT_ICONS[level]}
                title={level}
                description={description}
                scale={COMFORT_DOT_COUNT[level]}
              />
            </li>
          ))}
        </ul>
      </SidebarSection>

      <SidebarSection title="Виды отдыха" icon={Compass}>
        <ul className="space-y-1">
          {activityOptions.map(({ type, icon }) => (
            <li key={type}>
              <SidebarOption
                selected={filters.activityTypes.includes(type)}
                onClick={() =>
                  patch({
                    activityTypes: toggle(filters.activityTypes, type),
                  })
                }
                icon={icon}
                title={type}
              />
            </li>
          ))}
        </ul>
      </SidebarSection>
    </div>
  );
}
