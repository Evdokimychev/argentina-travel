import type { ReadonlyURLSearchParams } from "next/navigation";
import { MAP_MARKER_KINDS, type MapMarkerKind } from "@/lib/map-types";

export const DEFAULT_MAP_ARGENTINA_KINDS: MapMarkerKind[] = [
  "city",
  "national_park",
  "attraction",
  "tour",
];

export interface MapArgentinaUrlState {
  kinds: MapMarkerKind[];
  city: string;
  q: string;
  selected: string;
}

function isMapMarkerKind(value: string): value is MapMarkerKind {
  return (MAP_MARKER_KINDS as readonly string[]).includes(value);
}

export function parseMapArgentinaKindsParam(raw: string | null): MapMarkerKind[] {
  if (!raw?.trim()) return [...DEFAULT_MAP_ARGENTINA_KINDS];
  const parsed = raw
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(isMapMarkerKind);
  return parsed.length > 0 ? [...new Set(parsed)] : [...DEFAULT_MAP_ARGENTINA_KINDS];
}

export function parseMapArgentinaUrlState(
  params: ReadonlyURLSearchParams | URLSearchParams
): MapArgentinaUrlState {
  return {
    kinds: parseMapArgentinaKindsParam(params.get("kind")),
    city: params.get("city")?.trim() ?? "",
    q: params.get("q")?.trim() ?? "",
    selected: params.get("selected")?.trim() ?? "",
  };
}

export function mapArgentinaStateToSearchParams(state: MapArgentinaUrlState): URLSearchParams {
  const params = new URLSearchParams();
  const kindsKey = state.kinds.join(",");
  const defaultKindsKey = DEFAULT_MAP_ARGENTINA_KINDS.join(",");
  if (kindsKey !== defaultKindsKey) params.set("kind", kindsKey);
  if (state.city) params.set("city", state.city);
  if (state.q) params.set("q", state.q);
  if (state.selected) params.set("selected", state.selected);
  return params;
}

export function buildMapArgentinaPath(state: MapArgentinaUrlState): string {
  const qs = mapArgentinaStateToSearchParams(state).toString();
  return qs ? `/mapa-argentina?${qs}` : "/mapa-argentina";
}

export function toggleMapArgentinaKind(
  kinds: MapMarkerKind[],
  kind: MapMarkerKind
): MapMarkerKind[] {
  if (kinds.includes(kind)) {
    const next = kinds.filter((item) => item !== kind);
    return next.length > 0 ? next : [...DEFAULT_MAP_ARGENTINA_KINDS];
  }
  return [...kinds, kind];
}
