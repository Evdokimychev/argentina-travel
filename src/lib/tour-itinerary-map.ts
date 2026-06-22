import type { TourRoutePoint } from "@/types";

export function getRoutePointsForDay(
  routePoints: TourRoutePoint[] | undefined,
  dayNumber: number
): TourRoutePoint[] {
  if (!routePoints?.length) return [];
  return routePoints.filter((point) => point.dayNumber === dayNumber);
}
