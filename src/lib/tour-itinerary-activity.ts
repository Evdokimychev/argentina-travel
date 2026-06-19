import {
  getItineraryActivityKindOption,
  inferItineraryActivityKind,
  ITINERARY_ACTIVITY_KINDS_FLAT,
  type ItineraryActivityKind,
} from "@/data/itinerary-activity-kinds";
import type { TourDayActivity } from "@/types/tour-itinerary-activity";
import { ORGANIZER_TOUR_DAY_ACTIVITY_DESCRIPTION_MAX } from "@/types/tour-itinerary-activity";

export function createDayActivityId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyDayActivity(kind: ItineraryActivityKind = "custom"): TourDayActivity {
  return { id: createDayActivityId(), kind };
}

function parsePositiveNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(",", "."));
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return undefined;
}

function normalizeKind(value: unknown): ItineraryActivityKind {
  if (
    typeof value === "string" &&
    ITINERARY_ACTIVITY_KINDS_FLAT.includes(value as ItineraryActivityKind)
  ) {
    return value as ItineraryActivityKind;
  }
  return "custom";
}

export function normalizeDayActivity(raw: Partial<TourDayActivity> | string): TourDayActivity {
  if (typeof raw === "string") {
    const title = raw.trim();
    return {
      id: createDayActivityId(),
      kind: inferItineraryActivityKind(title),
      title: title || undefined,
    };
  }

  const kind = normalizeKind(raw.kind);
  const title = raw.title?.trim();
  const description = raw.description?.trim().slice(0, ORGANIZER_TOUR_DAY_ACTIVITY_DESCRIPTION_MAX);

  return {
    id: raw.id?.trim() || createDayActivityId(),
    kind,
    title: title || undefined,
    description: description || undefined,
    durationLabel: raw.durationLabel?.trim() || undefined,
    durationMinutes: parsePositiveNumber(raw.durationMinutes),
    distanceKm: parsePositiveNumber(raw.distanceKm),
    elevationGainM: parsePositiveNumber(raw.elevationGainM),
    elevationLossM: parsePositiveNumber(raw.elevationLossM),
  };
}

export function normalizeDayActivities(
  items: Array<Partial<TourDayActivity> | string> | undefined
): TourDayActivity[] {
  if (!items?.length) return [];
  return items.map((item) => normalizeDayActivity(item));
}

export function migrateLegacyActivities(items: string[] | undefined): TourDayActivity[] {
  if (!items?.length) return [];
  return items.filter(Boolean).map((item) => normalizeDayActivity(item));
}

function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const hours = minutes / 60;
  if (Number.isInteger(hours)) return `${hours} ч`;
  const wholeHours = Math.floor(hours);
  const restMinutes = minutes - wholeHours * 60;
  if (restMinutes === 0) return `${wholeHours} ч`;
  return `${wholeHours} ч ${restMinutes} мин`;
}

export function formatDayActivityMetadata(activity: TourDayActivity): string {
  const parts: string[] = [];

  if (activity.durationLabel?.trim()) {
    parts.push(activity.durationLabel.trim());
  } else if (activity.durationMinutes) {
    parts.push(formatDurationMinutes(activity.durationMinutes));
  }

  if (activity.distanceKm) {
    const value =
      Number.isInteger(activity.distanceKm) || activity.distanceKm >= 10
        ? Math.round(activity.distanceKm)
        : Math.round(activity.distanceKm * 10) / 10;
    parts.push(`${value} км`);
  }

  if (activity.elevationGainM) {
    parts.push(`${Math.round(activity.elevationGainM)} м ↑`);
  }

  if (activity.elevationLossM) {
    parts.push(`${Math.round(activity.elevationLossM)} м ↓`);
  }

  return parts.join(" · ");
}

export function formatDayActivitiesForPdf(activities: TourDayActivity[]): string {
  return activities
    .map((activity) => {
      const meta = formatDayActivityMetadata(activity);
      const label = activity.title?.trim() || getItineraryActivityKindOption(activity.kind).label;
      return meta ? `${label} (${meta})` : label;
    })
    .join(" · ");
}
