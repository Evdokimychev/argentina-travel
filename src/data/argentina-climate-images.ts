import { getClimateMonthImage as resolveClimateMonthImage } from "@/lib/media-resolver";

export type ClimateViewMode = "cards" | "schedule";

/** Thematic photo for a climate month card (local Wikimedia via media library). */
export function getClimateMonthImage(regionId: string, month: number): string {
  return resolveClimateMonthImage(regionId, month);
}
