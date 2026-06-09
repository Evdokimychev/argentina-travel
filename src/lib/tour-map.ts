import { TourListing } from "@/types";

export function escapeMapHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getTourMapBounds(tours: TourListing[]): [[number, number], [number, number]] | null {
  if (tours.length === 0) return null;
  let minLat = tours[0].latitude;
  let maxLat = tours[0].latitude;
  let minLng = tours[0].longitude;
  let maxLng = tours[0].longitude;

  for (const tour of tours) {
    minLat = Math.min(minLat, tour.latitude);
    maxLat = Math.max(maxLat, tour.latitude);
    minLng = Math.min(minLng, tour.longitude);
    maxLng = Math.max(maxLng, tour.longitude);
  }

  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}

export const ARGENTINA_MAP_CENTER: [number, number] = [-38.5, -63.5];
export const ARGENTINA_DEFAULT_ZOOM = 4;
