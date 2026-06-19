import { TourListing } from "@/types";

export function escapeMapHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getLatLngBounds(
  points: Array<{ latitude: number; longitude: number }>
): [[number, number], [number, number]] | null {
  if (points.length === 0) return null;
  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLng = points[0].longitude;
  let maxLng = points[0].longitude;

  for (const point of points) {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLng = Math.min(minLng, point.longitude);
    maxLng = Math.max(maxLng, point.longitude);
  }

  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}

export function getTourMapBounds(tours: TourListing[]): [[number, number], [number, number]] | null {
  return getLatLngBounds(tours);
}

export const ARGENTINA_MAP_CENTER: [number, number] = [-38.5, -63.5];
export const ARGENTINA_DEFAULT_ZOOM = 4;
