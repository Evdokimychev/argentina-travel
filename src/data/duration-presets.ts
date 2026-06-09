import { DurationBucket } from "@/types";
import { formatDays, formatNights } from "@/lib/pluralize";

export interface DurationPreset {
  bucket: DurationBucket;
  min: number;
  max: number;
}

export const DURATION_PRESETS: DurationPreset[] = [
  { bucket: "1 день", min: 1, max: 1 },
  { bucket: "2–3 дня", min: 2, max: 3 },
  { bucket: "4–7 дней", min: 4, max: 7 },
  { bucket: "8–14 дней", min: 8, max: 14 },
  { bucket: "15+ дней", min: 15, max: 365 },
];

export const DURATION_MAX_DAYS = 365;

export function rangeFromPresets(buckets: DurationBucket[]): {
  min: number;
  max: number;
} {
  const presets = DURATION_PRESETS.filter((p) => buckets.includes(p.bucket));
  return {
    min: Math.min(...presets.map((p) => p.min)),
    max: Math.max(...presets.map((p) => p.max)),
  };
}

export function getDurationPresetForDays(days: number): DurationPreset {
  return (
    DURATION_PRESETS.find((p) => days >= p.min && days <= p.max) ??
    DURATION_PRESETS[DURATION_PRESETS.length - 1]
  );
}

export function durationScaleLevel(days: number): number {
  const index = DURATION_PRESETS.findIndex((p) => days >= p.min && days <= p.max);
  return index === -1 ? DURATION_PRESETS.length : index + 1;
}

/** @deprecated Use formatDays from @/lib/pluralize */
export function formatDaysCount(days: number): string {
  return formatDays(days);
}

/** @deprecated Use formatNights from @/lib/pluralize */
export function formatNightsCount(nights: number): string {
  return formatNights(nights);
}

export function isDurationFilterActive(filters: {
  durationMin: number | null;
  durationMax: number | null;
  dayTripsOnly: boolean;
}): boolean {
  return (
    filters.dayTripsOnly ||
    filters.durationMin != null ||
    filters.durationMax != null
  );
}
