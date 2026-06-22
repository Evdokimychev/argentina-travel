import type { MapMarkerKind } from "@/lib/map-types";

/** Цвета маркеров на /mapa-argentina — общий источник для canvas и легенды. */
export const MAP_KIND_COLORS: Record<MapMarkerKind, string> = {
  city: "#2563eb",
  national_park: "#059669",
  attraction: "#d97706",
  tour: "#7c3aed",
  airport: "#0891b2",
  route: "#6366f1",
  region: "#94a3b8",
  transport: "#64748b",
};
