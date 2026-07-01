"use client";

import { Layers3, Mountain, Tag, Waypoints, type LucideIcon } from "lucide-react";
import MapThemePicker from "@/components/map/MapThemePicker";
import type { MapBasemapThemeId } from "@/lib/map-basemap-themes";
import {
  MAP_OVERLAY_LAYER_IDS,
  MAP_OVERLAY_LAYERS,
  type MapOverlayLayerId,
  type MapOverlayState,
} from "@/lib/map-overlay-layers";
import { cn } from "@/lib/cn";

const OVERLAY_ICONS: Record<MapOverlayLayerId, LucideIcon> = {
  hillshade: Mountain,
  terrain3d: Layers3,
  contours: Waypoints,
  labels: Tag,
};

type Props = {
  mapTheme: MapBasemapThemeId;
  onMapThemeChange: (theme: MapBasemapThemeId) => void;
  overlays: MapOverlayState;
  onToggleOverlay: (layerId: MapOverlayLayerId) => void;
  className?: string;
};

export default function MapAppearancePanel({
  mapTheme,
  onMapThemeChange,
  overlays,
  onToggleOverlay,
  className,
}: Props) {
  return (
    <div className={cn("space-y-2.5", className)}>
      <MapThemePicker value={mapTheme} onChange={onMapThemeChange} />

      <div className="space-y-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate">Слои:</span>
        <div className="flex flex-wrap gap-1.5">
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
                  "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold transition",
                  active
                    ? "border-emerald-500/40 bg-emerald-600 text-white shadow-sm"
                    : "border-gray-200/90 bg-white/90 text-charcoal hover:border-emerald-400/40 hover:text-emerald-700"
                )}
                aria-pressed={active}
              >
                <Icon className="h-3 w-3" aria-hidden />
                {layer.label}
              </button>
            );
          })}
        </div>
        {mapTheme === "satellite" && !overlays.labels ? (
          <p className="text-[10px] leading-snug text-slate">
            На спутниковой подложке включите «Подписи», чтобы видеть названия городов.
          </p>
        ) : overlays.terrain3d ? (
          <p className="text-[10px] leading-snug text-slate">
            Для 3D-рельефа наклоните карту двумя пальцами или кнопкой наклона справа.
          </p>
        ) : null}
      </div>
    </div>
  );
}
