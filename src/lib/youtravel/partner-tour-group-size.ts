import type { YouTravelTour } from "@/lib/youtravel/types";

function parsePositiveInt(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return undefined;
  return parsed;
}

/** Размер группы из payload YouTravel (camelCase и snake_case). */
export function resolveYouTravelGroupSize(payload: YouTravelTour): {
  min: number;
  max: number;
} {
  const min =
    parsePositiveInt(payload.groupSizeMin) ??
    parsePositiveInt(payload.group_size_min) ??
    parsePositiveInt(payload.min_group_size) ??
    1;

  const max =
    parsePositiveInt(payload.groupSizeMax) ??
    parsePositiveInt(payload.group_size_max) ??
    parsePositiveInt(payload.max_group_size) ??
    parsePositiveInt(payload.group_size) ??
    parsePositiveInt(payload.participants_max) ??
    parsePositiveInt(payload.participantsMax) ??
    16;

  return {
    min,
    max: Math.max(min, max),
  };
}
