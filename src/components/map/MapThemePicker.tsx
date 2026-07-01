"use client";

import { Leaf, Map, Moon, Sun, type LucideIcon } from "lucide-react";
import {
  MAP_BASEMAP_THEMES,
  MAP_BASEMAP_THEME_IDS,
  type MapBasemapThemeId,
} from "@/lib/map-basemap-themes";
import { cn } from "@/lib/cn";

const THEME_ICONS: Record<MapBasemapThemeId, LucideIcon> = {
  tourist: Map,
  light: Sun,
  nature: Leaf,
  contrast: Moon,
};

type Props = {
  value: MapBasemapThemeId;
  onChange: (theme: MapBasemapThemeId) => void;
  className?: string;
};

export default function MapThemePicker({ value, onChange, className }: Props) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <span className="mr-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate">Карта:</span>
      {MAP_BASEMAP_THEME_IDS.map((themeId) => {
        const theme = MAP_BASEMAP_THEMES[themeId];
        const Icon = THEME_ICONS[themeId];
        const active = value === themeId;
        return (
          <button
            key={themeId}
            type="button"
            title={theme.description}
            onClick={() => onChange(themeId)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold transition",
              active
                ? "border-sky/40 bg-sky text-white shadow-sm"
                : "border-gray-200/90 bg-white/90 text-charcoal hover:border-sky/30 hover:text-sky"
            )}
            aria-pressed={active}
          >
            <Icon className="h-3 w-3" aria-hidden />
            {theme.label}
          </button>
        );
      })}
    </div>
  );
}
