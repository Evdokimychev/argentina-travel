import { normalizeYouTravelArrivalCityLabel } from "@/lib/youtravel/partner-tour-locations";
import type { TourDetail } from "@/types";

export type TourEndpointLabels = {
  start?: string;
  finish?: string;
};

function trimEndpointLabel(raw?: string | null): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;

  if (trimmed.length <= 48) return trimmed;

  const firstSegment = trimmed.split(",")[0]?.trim();
  return firstSegment || trimmed.slice(0, 48);
}

/** Города или точки старта и финиша тура для компактного отображения в шапке. */
export function resolveTourEndpointLabels(
  tour: Pick<TourDetail, "partnerContent" | "startLocation" | "arrival" | "routePoints">,
): TourEndpointLabels {
  const partnerContent = tour.partnerContent;
  const arrivalInfo = partnerContent?.arrivalInfo;

  let start = arrivalInfo?.startCity
    ? normalizeYouTravelArrivalCityLabel(arrivalInfo.startCity)
    : undefined;
  let finish = arrivalInfo?.finishCity
    ? normalizeYouTravelArrivalCityLabel(arrivalInfo.finishCity)
    : undefined;

  if (!start) {
    start =
      trimEndpointLabel(partnerContent?.meetingPoint) ??
      trimEndpointLabel(tour.startLocation) ??
      trimEndpointLabel(tour.arrival?.meetingPoint);
  }

  if (!finish) {
    finish = trimEndpointLabel(partnerContent?.finishPoint);
  }

  const routePoints = tour.routePoints;
  if (!start && routePoints?.length) {
    start = trimEndpointLabel(routePoints[0]?.name);
  }
  if (!finish && routePoints?.length) {
    finish = trimEndpointLabel(routePoints[routePoints.length - 1]?.name);
  }

  return { start, finish };
}

export function hasTourEndpointLabels(endpoints: TourEndpointLabels): boolean {
  return Boolean(endpoints.start?.trim() || endpoints.finish?.trim());
}
