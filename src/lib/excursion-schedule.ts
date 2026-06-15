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

export function normalizeScheduleTime(time: string): string {
  const parts = time.trim().split(":");
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  }
  return time.trim();
}

function mapSlot(slot: TripsterScheduleSlot): ExcursionScheduleSlot | null {
  const time = slot.time_start?.trim();
  if (!time) return null;

  return {
    time: normalizeScheduleTime(time),
    timeEnd: slot.time_end ? normalizeScheduleTime(slot.time_end) : undefined,
    priceText: slot.price?.price_text,
    priceValue: slot.price?.price_value,
  };
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
      slots: (schedule[date] ?? [])
        .map(mapSlot)
        .filter((slot): slot is ExcursionScheduleSlot => slot != null),
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
