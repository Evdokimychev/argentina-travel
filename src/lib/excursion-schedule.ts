import type { TripsterScheduleResponse, TripsterScheduleSlot } from "@/lib/tripster/types";

export type ExcursionScheduleDate = {
  date: string;
  slots: ExcursionScheduleSlot[];
};

export type ExcursionScheduleSlot = {
  time: string;
  timeEnd?: string;
  priceText?: string;
  priceValue?: number;
};

/** Шаг слотов в интервале Tripster (`type: "range"`). */
export const TRIPSTER_RANGE_SLOT_STEP_MINUTES = 30;

export function normalizeScheduleTime(time: string): string {
  const parts = time.trim().split(":");
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  }
  return time.trim();
}

function parseTimeToMinutes(time: string): number | null {
  const normalized = normalizeScheduleTime(time);
  const match = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours > 23 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

function minutesToScheduleTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** First bookable grid point on or after `totalMinutes` (Tripster range slots use 30-min steps). */
export function ceilMinutesToScheduleStep(
  totalMinutes: number,
  step = TRIPSTER_RANGE_SLOT_STEP_MINUTES
): number {
  if (step <= 0) return totalMinutes;
  const remainder = totalMinutes % step;
  return remainder === 0 ? totalMinutes : totalMinutes + (step - remainder);
}

/** Tripster `time_end: "00:00"` means end of the operating day, not start of day. */
function resolveRangeEndMinutes(startMinutes: number, timeEnd: string): number | null {
  const endMinutes = parseTimeToMinutes(timeEnd);
  if (endMinutes == null) return null;
  if (endMinutes === 0 && startMinutes > 0) return 24 * 60;
  if (endMinutes < startMinutes) return 24 * 60;
  return endMinutes;
}

/** Adds minutes to HH:MM and wraps within a 24-hour day. */
export function addMinutesToScheduleTime(time: string, minutesToAdd: number): string | null {
  const startMinutes = parseTimeToMinutes(time);
  if (startMinutes == null || minutesToAdd <= 0) return null;
  return minutesToScheduleTime((startMinutes + minutesToAdd) % (24 * 60));
}

function slotPriceFields(slot: TripsterScheduleSlot): Pick<ExcursionScheduleSlot, "priceText" | "priceValue"> {
  return {
    priceText: slot.price?.price_text,
    priceValue: slot.price?.price_value,
  };
}

function mapDiscreteSlot(slot: TripsterScheduleSlot, time: string): ExcursionScheduleSlot {
  return {
    time: normalizeScheduleTime(time),
    ...slotPriceFields(slot),
  };
}

function expandRangeSlot(
  slot: TripsterScheduleSlot,
  timeStart: string,
  timeEnd: string
): ExcursionScheduleSlot[] {
  const startMinutes = parseTimeToMinutes(timeStart);
  const endMinutes = resolveRangeEndMinutes(startMinutes ?? -1, timeEnd);
  const priceFields = slotPriceFields(slot);

  if (startMinutes == null || endMinutes == null) {
    return [
      {
        time: normalizeScheduleTime(timeStart),
        timeEnd: timeEnd ? normalizeScheduleTime(timeEnd) : undefined,
        ...priceFields,
      },
    ];
  }

  const gridStart = ceilMinutesToScheduleStep(startMinutes);
  const lastMinute =
    endMinutes >= 24 * 60 ? 24 * 60 - TRIPSTER_RANGE_SLOT_STEP_MINUTES : endMinutes;

  if (gridStart > lastMinute) {
    return [mapDiscreteSlot(slot, timeStart)];
  }

  const slots: ExcursionScheduleSlot[] = [];
  for (
    let minutes = gridStart;
    minutes <= lastMinute;
    minutes += TRIPSTER_RANGE_SLOT_STEP_MINUTES
  ) {
    slots.push({
      time: minutesToScheduleTime(minutes),
      ...priceFields,
    });
  }

  return slots.length > 0 ? slots : [mapDiscreteSlot(slot, timeStart)];
}

export function mapTripsterScheduleSlot(slot: TripsterScheduleSlot): ExcursionScheduleSlot[] {
  const type = slot.type?.trim().toLowerCase();
  const time = slot.time?.trim();
  const timeStart = slot.time_start?.trim();
  const timeEnd = slot.time_end?.trim();

  if (type === "slot" || (time && !timeStart)) {
    if (!time) return [];
    return [mapDiscreteSlot(slot, time)];
  }

  const start = timeStart ?? time;
  if (!start) return [];

  if (type === "range" || timeEnd) {
    if (!timeEnd) {
      return [mapDiscreteSlot(slot, start)];
    }
    return expandRangeSlot(slot, start, timeEnd);
  }

  return [
    {
      time: normalizeScheduleTime(start),
      timeEnd: timeEnd ? normalizeScheduleTime(timeEnd) : undefined,
      ...slotPriceFields(slot),
    },
  ];
}

function dedupeSlotsByTime(slots: ExcursionScheduleSlot[]): ExcursionScheduleSlot[] {
  const seen = new Set<string>();
  const result: ExcursionScheduleSlot[] = [];

  for (const slot of slots) {
    if (seen.has(slot.time)) continue;
    seen.add(slot.time);
    result.push(slot);
  }

  return result.sort((a, b) => a.time.localeCompare(b.time, "ru"));
}

export function parseExcursionSchedule(response: TripsterScheduleResponse): {
  timezone?: string;
  dates: ExcursionScheduleDate[];
  maxPersons?: number;
} {
  const schedule = response.schedule ?? {};
  const dates = Object.keys(schedule)
    .sort()
    .map((date) => ({
      date,
      slots: dedupeSlotsByTime(
        (schedule[date] ?? []).flatMap((slot) => mapTripsterScheduleSlot(slot))
      ),
    }))
    .filter((entry) => entry.slots.length > 0);

  return {
    timezone: response.timezone,
    dates,
    maxPersons: response.defaults?.available_persons,
  };
}

export function buildDefaultTickets(
  ticketOptions: Array<{ id: number; isDefault?: boolean }>,
  personsCount: number
): Array<{ id: number; count: number }> {
  if (ticketOptions.length === 0) {
    return [];
  }

  const defaultTicket =
    ticketOptions.find((ticket) => ticket.isDefault) ?? ticketOptions[0];

  return [{ id: defaultTicket.id, count: personsCount }];
}
