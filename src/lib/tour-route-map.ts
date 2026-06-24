import type { TourRoutePoint } from "@/types";
import { escapeHtml } from "@/lib/rich-text";

const EARTH_RADIUS_KM = 6371;

export function haversineKm(
  a: Pick<TourRoutePoint, "lat" | "lng">,
  b: Pick<TourRoutePoint, "lat" | "lng">
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function computeRouteDistanceKm(points: TourRoutePoint[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += haversineKm(points[index - 1], points[index]);
  }
  return total;
}

export function formatRouteDistanceKm(km: number): string {
  if (km < 1) return "< 1 км";
  if (km < 10) return `${km.toFixed(1)} км`;
  return `${Math.round(km)} км`;
}

export interface RouteInterpolation {
  lat: number;
  lng: number;
  segmentIndex: number;
  segmentProgress: number;
}

export function interpolateRoutePosition(
  points: TourRoutePoint[],
  progress: number
): RouteInterpolation | null {
  if (!points.length) return null;
  if (points.length === 1) {
    return { lat: points[0].lat, lng: points[0].lng, segmentIndex: 0, segmentProgress: 0 };
  }

  const clamped = Math.min(1, Math.max(0, progress));
  const segments = points.slice(1).map((point, index) => haversineKm(points[index], point));
  const total = segments.reduce((sum, distance) => sum + distance, 0);

  if (total === 0) {
    const index = Math.round(clamped * (points.length - 1));
    const point = points[index];
    return { lat: point.lat, lng: point.lng, segmentIndex: Math.max(0, index - 1), segmentProgress: 0 };
  }

  let remaining = clamped * total;
  for (let index = 0; index < segments.length; index += 1) {
    const segmentLength = segments[index];
    if (remaining <= segmentLength || index === segments.length - 1) {
      const t = segmentLength === 0 ? 0 : Math.min(1, remaining / segmentLength);
      const from = points[index];
      const to = points[index + 1];
      return {
        lat: from.lat + (to.lat - from.lat) * t,
        lng: from.lng + (to.lng - from.lng) * t,
        segmentIndex: index,
        segmentProgress: t,
      };
    }
    remaining -= segmentLength;
  }

  const last = points[points.length - 1];
  return {
    lat: last.lat,
    lng: last.lng,
    segmentIndex: points.length - 2,
    segmentProgress: 1,
  };
}

export function progressToPointIndex(progress: number, pointCount: number): number {
  if (pointCount <= 1) return 0;
  return Math.round(Math.min(1, Math.max(0, progress)) * (pointCount - 1));
}

export function pointIndexToProgress(index: number, pointCount: number): number {
  if (pointCount <= 1) return 0;
  return index / (pointCount - 1);
}

export type RoutePointRole = "start" | "finish" | "waypoint";

export function getRoutePointRole(index: number, total: number): RoutePointRole {
  if (total <= 1) return "start";
  if (index === 0) return "start";
  if (index === total - 1) return "finish";
  return "waypoint";
}

export function routePointRoleLabel(role: RoutePointRole): string {
  if (role === "start") return "Старт тура";
  if (role === "finish") return "Финиш тура";
  return "";
}

/** HTML-содержимое Leaflet-popup для точки маршрута. */
export function buildRouteMapPopupHtml(
  point: TourRoutePoint,
  role: RoutePointRole,
): string {
  const roleText = routePointRoleLabel(role);
  const name = escapeHtml(point.name);
  const imageUrl = point.imageUrl?.trim();
  const safeImageUrl =
    imageUrl && /^https?:\/\//i.test(imageUrl) ? escapeHtml(imageUrl) : null;

  const roleBadge = roleText
    ? `<span class="route-map-popup-role route-map-popup-role--${role}">${escapeHtml(roleText)}</span>`
    : "";
  const dayLine =
    point.dayNumber != null
      ? `<p class="route-map-popup-day">День ${point.dayNumber}</p>`
      : "";
  const photo = safeImageUrl
    ? `<div class="route-map-popup-photo"><img src="${safeImageUrl}" alt="${name}" loading="lazy" decoding="async" /></div>`
    : "";

  return `<div class="route-map-popup-card">${photo}<div class="route-map-popup-body"><p class="route-map-popup-title">${name}</p>${roleBadge ? `<div class="route-map-popup-meta">${roleBadge}</div>` : ""}${dayLine}</div></div>`;
}

export const ROUTE_MAP_POPUP_OPTIONS = {
  className: "route-map-popup",
  maxWidth: 280,
  minWidth: 180,
} as const;

/** Порог перекрытия маркеров на экране (px). */
export const ROUTE_MAP_CLUSTER_PIXEL_THRESHOLD = 34;

export type RouteMapMarkerGroup = {
  key: string;
  indices: number[];
  lat: number;
  lng: number;
};

type RouteMapPointProjection = {
  x: number;
  y: number;
};

function clusterKey(indices: number[]): string {
  return indices.slice().sort((a, b) => a - b).join("-");
}

function groupCenter(
  points: Pick<TourRoutePoint, "lat" | "lng">[],
  indices: number[],
): { lat: number; lng: number } {
  let latSum = 0;
  let lngSum = 0;
  for (const index of indices) {
    latSum += points[index]!.lat;
    lngSum += points[index]!.lng;
  }
  return { lat: latSum / indices.length, lng: lngSum / indices.length };
}

/** Группирует точки, чьи маркеры перекрываются на текущем масштабе карты. */
export function clusterRoutePointsByScreenDistance(
  points: Pick<TourRoutePoint, "id" | "lat" | "lng">[],
  project: (index: number) => RouteMapPointProjection,
  thresholdPx: number = ROUTE_MAP_CLUSTER_PIXEL_THRESHOLD,
): RouteMapMarkerGroup[] {
  if (!points.length) return [];

  const parent = points.map((_, index) => index);

  function find(index: number): number {
    if (parent[index] === index) return index;
    parent[index] = find(parent[index]!);
    return parent[index]!;
  }

  function union(a: number, b: number) {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent[rootB] = rootA;
  }

  for (let left = 0; left < points.length; left += 1) {
    const a = project(left);
    for (let right = left + 1; right < points.length; right += 1) {
      const b = project(right);
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      if (Math.hypot(dx, dy) <= thresholdPx) {
        union(left, right);
      }
    }
  }

  const grouped = new Map<number, number[]>();
  for (let index = 0; index < points.length; index += 1) {
    const root = find(index);
    const bucket = grouped.get(root) ?? [];
    bucket.push(index);
    grouped.set(root, bucket);
  }

  return Array.from(grouped.values()).map((indices) => {
    const sorted = indices.slice().sort((a, b) => a - b);
    const center = groupCenter(points, sorted);
    return {
      key: clusterKey(sorted),
      indices: sorted,
      lat: center.lat,
      lng: center.lng,
    };
  });
}

/** Подпись кластера: «6–8» для подряд идущих точек или «×3» иначе. */
export function formatRouteMapClusterLabel(indices: number[]): string {
  if (indices.length <= 1) return "";

  const sorted = indices.slice().sort((a, b) => a - b);
  const consecutive = sorted.every(
    (value, index) => index === 0 || value === sorted[index - 1]! + 1,
  );

  if (consecutive) {
    const first = sorted[0]! + 1;
    const last = sorted[sorted.length - 1]! + 1;
    return first === last ? String(first) : `${first}–${last}`;
  }

  return `×${sorted.length}`;
}

export function buildRouteMapClusterPopupHtml(
  points: TourRoutePoint[],
  indices: number[],
): string {
  const items = indices
    .slice()
    .sort((a, b) => a - b)
    .map((index) => {
      const point = points[index]!;
      const role = getRoutePointRole(index, points.length);
      const day =
        point.dayNumber != null
          ? `<span class="route-map-popup-day">День ${point.dayNumber}</span>`
          : "";
      const roleBadge = role !== "waypoint"
        ? `<span class="route-map-popup-role route-map-popup-role--${role}">${escapeHtml(routePointRoleLabel(role))}</span>`
        : "";
      const label =
        role === "start" ? "С" : role === "finish" ? "Ф" : String(index + 1);
      return `<li class="route-map-cluster-item"><span class="route-map-cluster-item-badge">${label}</span><div class="route-map-cluster-item-body"><p class="route-map-popup-title">${escapeHtml(point.name)}</p>${roleBadge}${day}</div></li>`;
    })
    .join("");

  return `<div class="route-map-cluster-popup"><p class="route-map-cluster-popup-title">${indices.length} ${indices.length === 1 ? "точка" : indices.length < 5 ? "точки" : "точек"} рядом</p><ul class="route-map-cluster-list">${items}</ul><p class="route-map-cluster-hint">Нажмите, чтобы раскрыть</p></div>`;
}

/** Координаты «паутины» вокруг центра кластера (в пикселях карты). */
export function buildRouteMapSpiderfyPositions(
  center: RouteMapPointProjection,
  count: number,
  radiusPx = 42,
): RouteMapPointProjection[] {
  if (count <= 1) return [center];

  return Array.from({ length: count }, (_, index) => {
    const angle = (2 * Math.PI * index) / count - Math.PI / 2;
    return {
      x: center.x + radiusPx * Math.cos(angle),
      y: center.y + radiusPx * Math.sin(angle),
    };
  });
}

