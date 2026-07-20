import type {
  MapDiscoveryMode,
  MapMarkerKind,
  MapObject,
} from "@/lib/map-types";

export const DEFAULT_MAP_DISCOVERY_MODE: MapDiscoveryMode = "highlights";

export const MAP_DISCOVERY_MODE_LABELS: Record<MapDiscoveryMode, string> = {
  highlights: "Главное",
  things_to_do: "Чем заняться",
  nature: "Природа",
  culture: "Культура и вино",
  getting_around: "Как добраться",
  all: "Все места",
};

export const MAP_DISCOVERY_MODE_DESCRIPTIONS: Record<MapDiscoveryMode, string> = {
  highlights: "Самые важные города, парки, места и аэропорты",
  things_to_do: "Достопримечательности, прогулки и экскурсии",
  nature: "Ледники, водопады, озёра, горы и заповедники",
  culture: "Музеи, история и винодельни",
  getting_around: "Аэропорты, транспорт и маршруты",
  all: "Все доступные точки без тематического отбора",
};

export const MAP_DISCOVERY_MODE_KINDS: Record<MapDiscoveryMode, MapMarkerKind[]> = {
  highlights: ["city", "national_park", "attraction", "tour", "excursion", "airport"],
  things_to_do: ["national_park", "attraction", "tour", "excursion"],
  nature: ["national_park", "attraction", "tour", "excursion"],
  culture: ["attraction", "tour", "excursion"],
  getting_around: ["airport", "transport", "route"],
  all: ["city", "national_park", "attraction", "tour", "excursion", "airport", "transport", "route"],
};

const NATURE_CATEGORIES = new Set([
  "national_park",
  "waterfall",
  "glacier",
  "lake",
  "mountain",
  "trekking",
  "beach",
  "viewpoint",
  "reserve",
  "wildlife",
]);

const CULTURE_CATEGORIES = new Set(["winery", "museum", "historic"]);

export function parseMapDiscoveryMode(value: string | null): MapDiscoveryMode {
  if (
    value &&
    ["highlights", "things_to_do", "nature", "culture", "getting_around", "all"].includes(value)
  ) {
    return value as MapDiscoveryMode;
  }
  return DEFAULT_MAP_DISCOVERY_MODE;
}

export function matchesMapDiscoveryMode(object: MapObject, mode: MapDiscoveryMode): boolean {
  if (mode === "all") return true;
  if (mode === "highlights") {
    return (
      object.featured === true ||
      object.kind === "national_park" ||
      (object.kind === "city" && (object.popularity ?? 0) >= 75)
    );
  }
  if (mode === "getting_around") {
    return object.kind === "airport" || object.kind === "transport";
  }
  if (mode === "things_to_do") {
    return ["national_park", "attraction", "tour", "excursion"].includes(object.kind);
  }
  if (mode === "nature") {
    return object.kind === "national_park" || Boolean(object.category && NATURE_CATEGORIES.has(object.category));
  }
  return Boolean(object.category && CULTURE_CATEGORIES.has(object.category));
}

export type NearbyMapObject = {
  object: MapObject;
  distanceKm: number;
};

export function mapDistanceKm(
  from: Pick<MapObject, "latitude" | "longitude">,
  to: Pick<MapObject, "latitude" | "longitude">,
): number {
  const radians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latDelta = radians(to.latitude - from.latitude);
  const lngDelta = radians(to.longitude - from.longitude);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(lngDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearbyMapObjects(
  selected: MapObject | null,
  objects: MapObject[],
  options: { limit?: number; maxDistanceKm?: number } = {},
): NearbyMapObject[] {
  if (!selected) return [];
  const limit = options.limit ?? 6;
  const maxDistanceKm = options.maxDistanceKm ?? 120;

  return objects
    .filter((object) => object.id !== selected.id && object.status !== "hidden")
    .map((object) => ({ object, distanceKm: mapDistanceKm(selected, object) }))
    .filter(({ distanceKm }) => distanceKm <= maxDistanceKm)
    .sort(
      (left, right) =>
        left.distanceKm - right.distanceKm ||
        Number(Boolean(right.object.featured)) - Number(Boolean(left.object.featured)) ||
        (right.object.importance ?? 0) - (left.object.importance ?? 0),
    )
    .slice(0, limit);
}
