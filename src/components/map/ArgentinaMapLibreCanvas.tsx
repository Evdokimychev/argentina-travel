"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { MapMarkerKind, MapObject, MapRouteItem } from "@/lib/map-types";
import type { MapBasemapThemeId } from "@/lib/map-basemap-themes";
import type { MapOverlayState } from "@/lib/map-overlay-layers";
import type { MapThematicState } from "@/lib/map-thematic-layers";

export type ArgentinaMapLibreCanvasProps = {
  objects: MapObject[];
  routes: MapRouteItem[];
  activeKinds: MapMarkerKind[];
  selectedId: string | null;
  theme: MapBasemapThemeId;
  overlays: MapOverlayState;
  thematic: MapThematicState;
  onSelect: (object: MapObject | null) => void;
  userLocation?: {
    latitude: number;
    longitude: number;
    requestId: number;
  } | null;
  className?: string;
  view?: import("@/lib/map-view-config").MapViewConfig;
};

const ArgentinaMapLibreCanvasInner = dynamic(
  () => import("@/components/map/ArgentinaMapLibreCanvasInner"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#e8eef4] text-sm text-slate">
        Загрузка карты…
      </div>
    ),
  }
);

export default function ArgentinaMapLibreCanvas(props: ArgentinaMapLibreCanvasProps) {
  const [interactive, setInteractive] = useState(false);

  if (!interactive) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_45%_35%,rgba(14,165,233,0.2),transparent_32%),linear-gradient(145deg,#e8f2f6_0%,#dce9df_48%,#d5e2e8_100%)] px-4 ${props.className ?? ""}`}
        role="region"
        aria-label="Интерактивная карта Аргентины"
      >
        <div className="max-w-sm rounded-2xl border border-white/80 bg-white/90 p-5 text-center shadow-lg backdrop-blur-sm">
          <p className="font-heading text-lg font-bold text-charcoal">Карта готова к просмотру</p>
          <p className="mt-2 text-sm leading-relaxed text-slate">
            Включите интерактивный режим, чтобы перемещать карту, менять масштаб и открывать объекты.
          </p>
          <button
            type="button"
            onClick={() => setInteractive(true)}
            className="mt-4 min-h-11 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
          >
            Открыть интерактивную карту
          </button>
        </div>
      </div>
    );
  }

  return <ArgentinaMapLibreCanvasInner {...props} />;
}
