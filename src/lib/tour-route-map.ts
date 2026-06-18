import type { TourRoutePoint } from "@/types";

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
