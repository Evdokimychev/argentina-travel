"use client";

import {
  Binoculars,
  Landmark,
  MapPinned,
  MountainSnow,
  Route,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  MAP_DISCOVERY_MODE_DESCRIPTIONS,
  MAP_DISCOVERY_MODE_LABELS,
} from "@/lib/map-discovery";
import type { MapDiscoveryMode } from "@/lib/map-types";
import { cn } from "@/lib/cn";

const ICONS: Record<MapDiscoveryMode, LucideIcon> = {
  highlights: Sparkles,
  things_to_do: Binoculars,
  nature: MountainSnow,
  culture: Landmark,
  getting_around: Route,
  all: MapPinned,
};

const MODES: MapDiscoveryMode[] = [
  "highlights",
  "things_to_do",
  "nature",
  "culture",
  "getting_around",
  "all",
];

type Props = {
  value: MapDiscoveryMode;
  onChange: (mode: MapDiscoveryMode) => void;
  disabled?: boolean;
  className?: string;
};

export default function MapDiscoveryPresets({ value, onChange, disabled, className }: Props) {
  return (
    <div
      className={cn("flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}
      aria-label="Сценарии просмотра карты"
    >
      {MODES.map((mode) => {
        const Icon = ICONS[mode];
        const active = value === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            disabled={disabled}
            aria-pressed={active}
            title={MAP_DISCOVERY_MODE_DESCRIPTIONS[mode]}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40",
              active
                ? "border-sky bg-sky text-white shadow-sm"
                : "border-gray-200 bg-white/90 text-charcoal hover:border-sky/40 hover:text-sky-ink",
              disabled && "cursor-wait opacity-70",
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {MAP_DISCOVERY_MODE_LABELS[mode]}
          </button>
        );
      })}
    </div>
  );
}
