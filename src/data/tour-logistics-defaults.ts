export const ORGANIZER_TICKET_RECOMMENDATIONS_MAX = 2000;
export const ORGANIZER_ARRIVAL_CITY_COMMENT_MAX = 1500;
export const ORGANIZER_ARRIVAL_CITIES_MAX = 10;

export type OrganizerTransportDayOption =
  | "tour_start_day"
  | "day_before_tour"
  | "tour_end_day"
  | "day_after_tour";

export const ORGANIZER_TRANSPORT_DAY_OPTIONS: {
  value: OrganizerTransportDayOption;
  label: string;
}[] = [
  { value: "tour_start_day", label: "В день начала тура" },
  { value: "day_before_tour", label: "За день до начала тура" },
  { value: "tour_end_day", label: "В день окончания тура" },
  { value: "day_after_tour", label: "На следующий день после тура" },
];

export interface OrganizerPlaneTransportSettings {
  enabled: boolean;
  arrivalDay: OrganizerTransportDayOption;
  latestArrivalTime: string;
  departureDay: OrganizerTransportDayOption;
  earliestDepartureTime: string;
}

export interface OrganizerArrivalDepartureCity {
  id: string;
  city: string;
  canArrive: boolean;
  canDepart: boolean;
  plane: OrganizerPlaneTransportSettings;
  trainEnabled: boolean;
  otherEnabled: boolean;
  comment: string;
}

function createLogisticsId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `logistics-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultPlaneTransport(): OrganizerPlaneTransportSettings {
  return {
    enabled: true,
    arrivalDay: "tour_start_day",
    latestArrivalTime: "18:00",
    departureDay: "tour_end_day",
    earliestDepartureTime: "19:30",
  };
}

export function createEmptyArrivalDepartureCity(city = ""): OrganizerArrivalDepartureCity {
  return {
    id: createLogisticsId(),
    city,
    canArrive: true,
    canDepart: true,
    plane: createDefaultPlaneTransport(),
    trainEnabled: false,
    otherEnabled: false,
    comment: "",
  };
}

export function getTransportDayLabel(value: OrganizerTransportDayOption): string {
  return ORGANIZER_TRANSPORT_DAY_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function buildPlaneSchedulePreview(city: OrganizerArrivalDepartureCity): string {
  if (!city.plane.enabled || !city.city.trim()) return "";

  const arrivalDay = getTransportDayLabel(city.plane.arrivalDay).toLowerCase();
  const departureDay = getTransportDayLabel(city.plane.departureDay).toLowerCase();

  return `Если тур начинается в выбранную дату, туристу нужно прибыть в ${city.city} ${arrivalDay} не позднее ${city.plane.latestArrivalTime}. Вылет возможен ${departureDay} не ранее ${city.plane.earliestDepartureTime}.`;
}

export function getTransportDayShortLabel(value: OrganizerTransportDayOption): string {
  const labels: Record<OrganizerTransportDayOption, string> = {
    tour_start_day: "в день начала тура",
    day_before_tour: "за день до начала тура",
    tour_end_day: "в день окончания тура",
    day_after_tour: "на следующий день после тура",
  };
  return labels[value];
}

export function formatLatestArrivalTime(time: string): string {
  const normalized = time.trim();
  if (!normalized) return "";
  return `До ${normalized.slice(0, 5)}`;
}

export function formatEarliestDepartureTime(time: string): string {
  const normalized = time.trim();
  if (!normalized) return "";
  return `После ${normalized.slice(0, 5)}`;
}

export function linesToLogisticsList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function normalizeArrivalDepartureCities(
  items: OrganizerArrivalDepartureCity[] | undefined
): OrganizerArrivalDepartureCity[] {
  return (items ?? []).slice(0, ORGANIZER_ARRIVAL_CITIES_MAX).map((item) => ({
    id: item.id?.trim() || createLogisticsId(),
    city: item.city.trim(),
    canArrive: item.canArrive ?? true,
    canDepart: item.canDepart ?? true,
    plane: {
      enabled: item.plane?.enabled ?? false,
      arrivalDay: item.plane?.arrivalDay ?? "tour_start_day",
      latestArrivalTime: item.plane?.latestArrivalTime?.trim() || "18:00",
      departureDay: item.plane?.departureDay ?? "tour_end_day",
      earliestDepartureTime: item.plane?.earliestDepartureTime?.trim() || "19:30",
    },
    trainEnabled: item.trainEnabled ?? false,
    otherEnabled: item.otherEnabled ?? false,
    comment: item.comment.trim().slice(0, ORGANIZER_ARRIVAL_CITY_COMMENT_MAX),
  }));
}
