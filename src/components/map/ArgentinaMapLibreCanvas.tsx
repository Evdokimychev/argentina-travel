"use client";

import dynamic from "next/dynamic";
import type { MapMarkerKind, MapObject, MapRouteItem } from "@/lib/map-types";
import type { MapBasemapThemeId } from "@/lib/map-basemap-themes";
import type { MapOverlayState } from "@/lib/map-overlay-layers";

export type ArgentinaMapLibreCanvasProps = {
  objects: MapObject[];
  routes: MapRouteItem[];
  activeKinds: MapMarkerKind[];
  selectedId: string | null;
  theme: MapBasemapThemeId;
  overlays: MapOverlayState;
  onSelect: (object: MapObject | null) => void;
  className?: string;
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
