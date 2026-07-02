"use client";

import { useEffect, useRef, useState } from "react";
import {
  Layers,
  Layers3,
  Leaf,
  Map,
  Moon,
  Mountain,
  Satellite,
  Sun,
  Tag,
  Waypoints,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  MAP_BASEMAP_THEMES,
  MAP_BASEMAP_THEME_IDS,
  type MapBasemapThemeId,
} from "@/lib/map-basemap-themes";
import {
  MAP_OVERLAY_LAYER_IDS,
  MAP_OVERLAY_LAYERS,
  type MapOverlayLayerId,
  type MapOverlayState,
} from "@/lib/map-overlay-layers";
import { cn } from "@/lib/cn";

const THEME_ICONS: Record<MapBasemapThemeId, LucideIcon> = {
  tourist: Map,
  light: Sun,
  nature: Leaf,
  satellite: Satellite,
  contrast: Moon,
};

const OVERLAY_ICONS: Record<MapOverlayLayerId, LucideIcon> = {
  hillshade: Mountain,
  terrain3d: Layers3,
  contours: Waypoints,
  labels: Tag,
};

type Props = {
  theme: MapBasemapThemeId;
  onThemeChange: (theme: MapBasemapThemeId) => void;
  overlays: MapOverlayState;
  onToggleOverlay: (layerId: MapOverlayLayerId) => void;
  className?: string;
};

/**
 * Компактный блок «Стиль и слои» у края карты — рядом с кнопками масштаба.
 * Свёрнут в круглую кнопку; раскрывается в аккуратную панель.
 */
export default function MapStyleLayersControl({
  theme,
  onThemeChange,
  overlays,
  onToggleOverlay,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const activeOverlaysCount = MAP_OVERLAY_LAYER_IDS.filter((id) => overlays[id]).length;

  return (
    <div ref={rootRef} className={cn("flex flex-col items-end", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-xl border shadow-md backdrop-blur-md transition",
          open
            ? "border-sky/40 bg-sky text-white"
            : "border-white/60 bg-white/92 text-charcoal hover:border-sky/40 hover:text-sky"
        )}
        title="Стиль карты и слои"
        aria-expanded={open}
        aria-label="Стиль карты и слои"
      >
        <Layers className="h-4.5 w-4.5" aria-hidden />
        {activeOverlaysCount > 0 && !open ? (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-sky text-[9px] font-bold text-white">
            {activeOverlaysCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="mt-2 w-[228px] rounded-2xl border border-white/60 bg-white/95 p-3 shadow-elevated backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate">
              Стиль карты
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-slate hover:bg-gray-100 hover:text-charcoal"
              aria-label="Закрыть панель слоёв"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>

          <div className="mt-1.5 grid grid-cols-5 gap-1">
            {MAP_BASEMAP_THEME_IDS.map((themeId) => {
              const meta = MAP_BASEMAP_THEMES[themeId];
              const Icon = THEME_ICONS[themeId];
              const active = theme === themeId;
              return (
                <button
                  key={themeId}
                  type="button"
                  title={`${meta.label} — ${meta.description}`}
                  onClick={() => onThemeChange(themeId)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-lg border px-1 py-1.5 transition",
                    active
                      ? "border-sky/40 bg-sky text-white shadow-sm"
                      : "border-gray-200/80 bg-white text-charcoal hover:border-sky/40 hover:text-sky"
                  )}
                  aria-pressed={active}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  <span className="text-[8px] font-semibold leading-none">{meta.label}</span>
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate">Слои</p>
          <div className="mt-1.5 space-y-1">
            {MAP_OVERLAY_LAYER_IDS.map((layerId) => {
              const layer = MAP_OVERLAY_LAYERS[layerId];
              const Icon = OVERLAY_ICONS[layerId];
              const active = overlays[layerId];
              return (
                <button
                  key={layerId}
                  type="button"
                  title={layer.description}
                  onClick={() => onToggleOverlay(layerId)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-[11px] font-semibold transition",
                    active
                      ? "border-emerald-500/40 bg-emerald-50 text-emerald-800"
                      : "border-gray-200/80 bg-white text-charcoal hover:border-emerald-400/40 hover:text-emerald-700"
                  )}
                  aria-pressed={active}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="flex-1">{layer.label}</span>
                  <span
                    className={cn(
                      "h-3.5 w-6 rounded-full transition",
                      active ? "bg-emerald-500" : "bg-gray-200"
                    )}
                  >
                    <span
                      className={cn(
                        "block h-3.5 w-3.5 rounded-full border-2 bg-white transition",
                        active
                          ? "translate-x-2.5 border-emerald-500"
                          : "translate-x-0 border-gray-200"
                      )}
                    />
                  </span>
                </button>
              );
            })}
          </div>

          {theme === "satellite" && !overlays.labels ? (
            <p className="mt-2 text-[10px] leading-snug text-slate">
              На спутнике включите «Подписи», чтобы видеть названия городов.
            </p>
          ) : overlays.terrain3d ? (
            <p className="mt-2 text-[10px] leading-snug text-slate">
              Наклоните карту двумя пальцами или кнопкой наклона, чтобы увидеть объём.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
