"use client";

import dynamic from "next/dynamic";
import type { MapMarkerKind, MapObject, MapRouteItem } from "@/lib/map-types";
import type { MapBasemapThemeId } from "@/lib/map-basemap-themes";
import type { MapOverlayState } from "@/lib/map-overlay-layers";
import type { MapThematicLayerId, MapThematicState } from "@/lib/map-thematic-layers";

export type ArgentinaMapLibreCanvasProps = {
  objects: MapObject[];
  routes: MapRouteItem[];
  activeKinds: MapMarkerKind[];
  selectedId: string | null;
  theme: MapBasemapThemeId;
  overlays: MapOverlayState;
  thematic: MapThematicState;
  enableThematicInteractions?: boolean;
  onThematicLayerLoadState?: (layerId: MapThematicLayerId, loading: boolean) => void;
  onSelect: (object: MapObject | null) => void;
  selectedFlightDestinationIata?: string | null;
  onSelectFlightDestination?: (iata: string | null) => void;
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
  return <ArgentinaMapLibreCanvasInner {...props} />;
}
