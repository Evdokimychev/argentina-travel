"use client";

import { useMemo, useState } from "react";
import ArgentinaMapLibreCanvas from "@/components/map/ArgentinaMapLibreCanvas";
import BuenosAiresBarriosLegend from "@/components/map/BuenosAiresBarriosLegend";
import {
  CABA_MAP_VIEW,
  CABA_RECOMMENDED_COUNT,
  type CabaBarrioRecord,
} from "@/data/map-barrios/caba-barrios";
import { cn } from "@/lib/cn";
import {
  DEFAULT_MAP_OVERLAY_STATE,
  type MapOverlayState,
} from "@/lib/map-overlay-layers";
import {
  DEFAULT_MAP_THEMATIC_STATE,
  type MapThematicState,
} from "@/lib/map-thematic-layers";
import type { MapBasemapThemeId } from "@/lib/map-basemap-themes";
import type { MapObject, MapRouteItem } from "@/lib/map-types";

export type BuenosAiresBarriosMapMode = "all" | "recommended" | "both";

export type BuenosAiresBarriosMapProps = {
  /** all — все 48 barrios; recommended — только рекомендуемые; both — оба слоя */
  mode?: BuenosAiresBarriosMapMode;
  /** Подсветить конкретный район (slug из реестра) */
  highlightSlug?: string;
  showLegend?: boolean;
  theme?: MapBasemapThemeId;
  className?: string;
  height?: number | string;
  onBarrioHover?: (barrio: CabaBarrioRecord | null) => void;
};

const EMPTY_OBJECTS: MapObject[] = [];
const EMPTY_ROUTES: MapRouteItem[] = [];

function buildThematicState(mode: BuenosAiresBarriosMapMode): MapThematicState {
  const base = { ...DEFAULT_MAP_THEMATIC_STATE };
  if (mode === "all") {
    return { ...base, ba_neighborhoods: true };
  }
  if (mode === "recommended") {
    return { ...base, ba_recommended: true };
  }
  return { ...base, ba_neighborhoods: true, ba_recommended: true };
}

/**
 * Встраиваемая карта районов CABA — для статей о Буэнос-Айресе, гидов и лендингов.
 * Границы OSM, подписи на русском, всплывающие карточки с описанием.
 */
export default function BuenosAiresBarriosMap({
  mode = "both",
  highlightSlug,
  showLegend = true,
  theme = "tourist",
  className,
  height = 420,
  onBarrioHover,
}: BuenosAiresBarriosMapProps) {
  const [overlays] = useState<MapOverlayState>(() => ({
    ...DEFAULT_MAP_OVERLAY_STATE,
    labels: true,
  }));

  const thematic = useMemo(() => buildThematicState(mode), [mode]);

  const view = useMemo(
    () => ({
      ...CABA_MAP_VIEW,
      lockView: true,
    }),
    []
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-slate-200 bg-[#e8eef4] shadow-sm",
        className
      )}
      style={{ height }}
      data-map-embed="buenos-aires-barrios"
      data-map-mode={mode}
      data-highlight-slug={highlightSlug ?? undefined}
    >
      <ArgentinaMapLibreCanvas
        objects={EMPTY_OBJECTS}
        routes={EMPTY_ROUTES}
        activeKinds={[]}
        selectedId={null}
        theme={theme}
        overlays={overlays}
        thematic={thematic}
        onSelect={() => {}}
        view={view}
        className="h-full w-full"
      />

      {showLegend ? (
        <BuenosAiresBarriosLegend
          mode={mode}
          recommendedCount={CABA_RECOMMENDED_COUNT}
          className="pointer-events-none absolute bottom-3 left-3 z-10"
        />
      ) : null}

      {onBarrioHover ? (
        <span className="sr-only">Наведите на район для подробностей</span>
      ) : null}
    </div>
  );
}

export { CABA_MAP_VIEW, CABA_RECOMMENDED_COUNT };
