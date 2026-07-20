import type { ReadonlyURLSearchParams } from "next/navigation";
import { parseMapBasemapTheme, type MapBasemapThemeId } from "@/lib/map-basemap-themes";
import {
  DEFAULT_MAP_OVERLAY_STATE,
  parseMapOverlayLayers,
  serializeMapOverlayLayers,
  type MapOverlayState,
} from "@/lib/map-overlay-layers";
import {
  DEFAULT_MAP_THEMATIC_STATE,
  parseMapThematicLayers,
  serializeMapThematicLayers,
  type MapThematicState,
} from "@/lib/map-thematic-layers";
import { MAP_MARKER_KINDS, type MapMarkerKind } from "@/lib/map-types";
import {
  DEFAULT_MAP_DISCOVERY_MODE,
  parseMapDiscoveryMode,
} from "@/lib/map-discovery";
import type { MapDiscoveryMode } from "@/lib/map-types";

export const DEFAULT_MAP_ARGENTINA_KINDS: MapMarkerKind[] = [
  "city",
  "national_park",
  "attraction",
  "tour",
  "airport",
];

/** All point marker kinds available in filter UI (without region polygons). */
export const ALL_MAP_FILTER_KINDS: MapMarkerKind[] = MAP_MARKER_KINDS.filter(
  (kind) => kind !== "region"
);

export const MAP_KINDS_NONE = "none" as const;

export interface MapArgentinaUrlState {
  kinds: MapMarkerKind[];
  city: string;
  q: string;
  selected: string;
  focus: MapDiscoveryMode;
  theme: MapBasemapThemeId;
  overlays: MapOverlayState;
  thematic: MapThematicState;
}

function isMapMarkerKind(value: string): value is MapMarkerKind {
  return (MAP_MARKER_KINDS as readonly string[]).includes(value);
}

export function parseMapArgentinaKindsParam(raw: string | null): MapMarkerKind[] {
  if (raw?.trim().toLowerCase() === MAP_KINDS_NONE) return [];
  if (!raw?.trim()) return [...DEFAULT_MAP_ARGENTINA_KINDS];
  const parsed = raw
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(isMapMarkerKind);
  return parsed.length > 0 ? [...new Set(parsed)] : [...DEFAULT_MAP_ARGENTINA_KINDS];
}

export function serializeMapArgentinaKinds(kinds: MapMarkerKind[]): string {
  if (kinds.length === 0) return MAP_KINDS_NONE;
  return kinds.join(",");
}

export function parseMapArgentinaUrlState(
  params: ReadonlyURLSearchParams | URLSearchParams
): MapArgentinaUrlState {
  return {
    kinds: parseMapArgentinaKindsParam(params.get("kind")),
    city: params.get("city")?.trim() ?? "",
    q: params.get("q")?.trim() ?? "",
    selected: params.get("selected")?.trim() ?? "",
    focus: parseMapDiscoveryMode(params.get("focus")),
    theme: parseMapBasemapTheme(params.get("theme")),
    overlays: parseMapOverlayLayers(params.get("layers")),
    thematic: parseMapThematicLayers(params.get("tl")),
  };
}

export function mapArgentinaStateToSearchParams(state: MapArgentinaUrlState): URLSearchParams {
  const params = new URLSearchParams();
  const kindsKey = serializeMapArgentinaKinds(state.kinds);
  const defaultKindsKey = serializeMapArgentinaKinds(DEFAULT_MAP_ARGENTINA_KINDS);
  if (kindsKey !== defaultKindsKey) params.set("kind", kindsKey);
  if (state.city) params.set("city", state.city);
  if (state.q) params.set("q", state.q);
  if (state.selected) params.set("selected", state.selected);
  if (state.focus !== DEFAULT_MAP_DISCOVERY_MODE) params.set("focus", state.focus);
  if (state.theme !== "tourist") params.set("theme", state.theme);
  const layersKey = serializeMapOverlayLayers(state.overlays);
  const defaultLayersKey = serializeMapOverlayLayers(DEFAULT_MAP_OVERLAY_STATE);
  if (layersKey && layersKey !== defaultLayersKey) params.set("layers", layersKey);
  const thematicKey = serializeMapThematicLayers(state.thematic);
  if (thematicKey) params.set("tl", thematicKey);
  return params;
}

export function buildMapArgentinaPath(state: MapArgentinaUrlState): string {
  const qs = mapArgentinaStateToSearchParams(state).toString();
  return qs ? `/mapa-argentina?${qs}` : "/mapa-argentina";
}

/** Deep link на страницу тура или его маршрут на карте. */
export function buildMapTourDeepLink(tour: { id: string; slug: string }): string {
  return buildMapArgentinaPath({
    kinds: ["tour", "route", "city", "national_park", "attraction"],
    city: "",
    q: "",
    selected: `tour:${tour.id}`,
    focus: "all",
    theme: "tourist",
    overlays: { ...DEFAULT_MAP_OVERLAY_STATE },
    thematic: { ...DEFAULT_MAP_THEMATIC_STATE },
  });
}

/** Deep link на место в справочнике. */
export function buildMapPlaceDeepLink(place: { id: string }): string {
  return buildMapArgentinaPath({
    kinds: ["city", "national_park", "attraction"],
    city: "",
    q: "",
    selected: `place:${place.id}`,
    focus: "all",
    theme: "tourist",
    overlays: { ...DEFAULT_MAP_OVERLAY_STATE },
    thematic: { ...DEFAULT_MAP_THEMATIC_STATE },
  });
}

export function toggleMapArgentinaKind(
  kinds: MapMarkerKind[],
  kind: MapMarkerKind
): MapMarkerKind[] {
  if (kinds.includes(kind)) {
    return kinds.filter((item) => item !== kind);
  }
  return [...kinds, kind];
}

export function selectAllMapFilterKinds(): MapMarkerKind[] {
  return [...ALL_MAP_FILTER_KINDS];
}

export function clearAllMapFilterKinds(): MapMarkerKind[] {
  return [];
}

export function resetMapFilterKinds(): MapMarkerKind[] {
  return [...DEFAULT_MAP_ARGENTINA_KINDS];
}
