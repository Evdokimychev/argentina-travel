import {
  DEFAULT_TRIP_PREP_TEMPLATE_ID,
  DEFAULT_TRIP_PREP_TEMPLATE_NAME,
  defaultTripPrepItemsAsViews,
  resolveLocalTripPrepTourType,
} from "@/data/trip-prep-defaults";
import { buildSummary, groupItemsByCategory } from "@/lib/trip-prep-summary";
import type { Booking } from "@/types/tourist";
import {
  TRIP_PREP_PROGRESS_STORAGE_KEY,
  type TripPrepChecklistResponse,
} from "@/types/trip-prep";

type StoredProgress = Record<string, Record<string, string>>;

function readStore(): StoredProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(TRIP_PREP_PROGRESS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredProgress;
  } catch {
    return {};
  }
}

function writeStore(store: StoredProgress) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TRIP_PREP_PROGRESS_STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

function checkedIdsForBooking(bookingId: string): Set<string> {
  const store = readStore();
  return new Set(Object.keys(store[bookingId] ?? {}));
}

export function buildLocalTripPrepChecklist(booking: Booking): TripPrepChecklistResponse {
  const checkedIds = checkedIdsForBooking(booking.id);
  const items = defaultTripPrepItemsAsViews(checkedIds);

  return {
    bookingId: booking.id,
    startDate: booking.startDate ?? null,
    tourTitle: booking.tourTitle,
    template: {
      id: DEFAULT_TRIP_PREP_TEMPLATE_ID,
      name: DEFAULT_TRIP_PREP_TEMPLATE_NAME,
      tourType: resolveLocalTripPrepTourType({
        bookingSource: booking.bookingSource,
        guests: booking.guests,
      }),
    },
    categories: groupItemsByCategory(items),
    summary: buildSummary(items),
  };
}

export function toggleLocalTripPrepProgress(input: {
  bookingId: string;
  itemId: string;
  checked: boolean;
}): void {
  const store = readStore();
  const bookingProgress = { ...(store[input.bookingId] ?? {}) };

  if (input.checked) {
    bookingProgress[input.itemId] = new Date().toISOString();
  } else {
    delete bookingProgress[input.itemId];
  }

  store[input.bookingId] = bookingProgress;
  writeStore(store);
}

export function getLocalTripPrepPercent(bookingId: string): number {
  const checkedIds = checkedIdsForBooking(bookingId);
  const items = defaultTripPrepItemsAsViews(checkedIds);
  return buildSummary(items).percent;
}
