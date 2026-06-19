import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json, TourRow } from "@/types/database";
import type { Database } from "@/types/database";
import { PUBLIC_TOUR_MODERATION_STATUSES } from "@/lib/tour-content-visibility";

type DbClient = SupabaseClient<Database>;

export type TourAvailabilitySlotStatus = "open" | "closed" | "sold_out";

export interface TourAvailabilitySlot {
  id?: string;
  tourId: string;
  date: string;
  capacity: number;
  bookedCount: number;
  availableCount: number;
  status: TourAvailabilitySlotStatus;
  source: "db" | "seed";
}

export interface SlotUpsertInput {
  date: string;
  capacity: number;
  bookedCount?: number;
  status?: TourAvailabilitySlotStatus;
}

export interface SlotReservation {
  tourId: string;
  date: string;
  guests: number;
}

interface SeedSlot {
  date: string;
  capacity: number;
  bookedCount: number;
  status: TourAvailabilitySlotStatus;
}

const DEFAULT_CAPACITY = 9999;

function toIsoDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  return normalized;
}

function clampInt(value: number, min = 0): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.floor(value));
}

function normalizeSlotStatus(
  status: string | null | undefined,
  capacity: number,
  bookedCount: number
): TourAvailabilitySlotStatus {
  if (status === "closed") return "closed";
  if (status === "sold_out") return "sold_out";
  if (capacity > 0 && bookedCount >= capacity) return "sold_out";
  return "open";
}

function toSlotFromDb(row: Database["public"]["Tables"]["tour_availability_slots"]["Row"]): TourAvailabilitySlot {
  const capacity = clampInt(row.capacity);
  const bookedCount = clampInt(row.booked_count);
  const status = normalizeSlotStatus(row.status, capacity, bookedCount);
  const availableCount = Math.max(capacity - bookedCount, 0);

  return {
    id: row.id,
    tourId: row.tour_id,
    date: row.date,
    capacity,
    bookedCount,
    availableCount,
    status,
    source: "db",
  };
}

function extractGroupDatesFromPayload(payload: Json): unknown[] {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return [];
  const candidate = payload as {
    booking?: { groupDates?: unknown[] };
  };
  return Array.isArray(candidate.booking?.groupDates) ? candidate.booking.groupDates : [];
}

function seedSlotsFromTourPayload(row: Pick<TourRow, "id" | "payload">): SeedSlot[] {
  const slots = new Map<string, SeedSlot>();
  const groupDates = extractGroupDatesFromPayload(row.payload);

  for (const item of groupDates) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const source = item as {
      startDate?: string;
      totalSeats?: number;
      spotsLeft?: number;
      status?: string;
    };
    const date = toIsoDate(source.startDate);
    if (!date) continue;

    const totalSeats = clampInt(source.totalSeats ?? 0);
    const spotsLeft = clampInt(source.spotsLeft ?? 0);
    const capacity = totalSeats > 0 ? totalSeats : spotsLeft > 0 ? spotsLeft : DEFAULT_CAPACITY;
    const bookedCount =
      totalSeats > 0 ? Math.max(totalSeats - spotsLeft, 0) : 0;
    const status = normalizeSlotStatus(source.status, capacity, bookedCount);

    slots.set(date, { date, capacity, bookedCount, status });
  }

  return Array.from(slots.values()).sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchTourRowBySlug(
  supabase: DbClient,
  slug: string
): Promise<Pick<TourRow, "id" | "payload"> | null> {
  const { data, error } = await supabase
    .from("tours")
    .select("id, payload, moderation_status")
    .eq("slug", slug)
    .eq("status", "published")
    .in("moderation_status", [...PUBLIC_TOUR_MODERATION_STATUSES])
    .maybeSingle();

  if (error || !data) return null;
  return data as Pick<TourRow, "id" | "payload">;
}

async function fetchTourRowById(
  supabase: DbClient,
  tourId: string
): Promise<Pick<TourRow, "id" | "payload"> | null> {
  const { data, error } = await supabase
    .from("tours")
    .select("id, payload")
    .eq("id", tourId)
    .maybeSingle();

  if (error || !data) return null;
  return data as Pick<TourRow, "id" | "payload">;
}

async function fetchDbSlots(
  supabase: DbClient,
  tourId: string
): Promise<TourAvailabilitySlot[]> {
  const { data, error } = await supabase
    .from("tour_availability_slots")
    .select("*")
    .eq("tour_id", tourId)
    .order("date", { ascending: true });

  if (error || !data) return [];
  return data.map(toSlotFromDb);
}

function mergeSeedSlots(
  tourId: string,
  dbSlots: TourAvailabilitySlot[],
  seedSlots: SeedSlot[]
): TourAvailabilitySlot[] {
  if (dbSlots.length === 0) {
    return seedSlots.map((slot) => ({
      tourId,
      date: slot.date,
      capacity: slot.capacity,
      bookedCount: slot.bookedCount,
      availableCount: Math.max(slot.capacity - slot.bookedCount, 0),
      status: slot.status,
      source: "seed",
    }));
  }

  const byDate = new Map<string, TourAvailabilitySlot>();
  for (const slot of dbSlots) byDate.set(slot.date, slot);

  for (const seed of seedSlots) {
    if (byDate.has(seed.date)) continue;
    byDate.set(seed.date, {
      tourId,
      date: seed.date,
      capacity: seed.capacity,
      bookedCount: seed.bookedCount,
      availableCount: Math.max(seed.capacity - seed.bookedCount, 0),
      status: seed.status,
      source: "seed",
    });
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export async function fetchTourAvailabilityBySlug(
  supabase: DbClient,
  slug: string
): Promise<{ tourId: string; slots: TourAvailabilitySlot[] } | null> {
  const tourRow = await fetchTourRowBySlug(supabase, slug);
  if (!tourRow) return null;

  const dbSlots = await fetchDbSlots(supabase, tourRow.id);
  const seedSlots = seedSlotsFromTourPayload(tourRow);

  return {
    tourId: tourRow.id,
    slots: mergeSeedSlots(tourRow.id, dbSlots, seedSlots),
  };
}

export async function fetchTourAvailabilityByTourId(
  supabase: DbClient,
  tourId: string
): Promise<TourAvailabilitySlot[]> {
  const dbSlots = await fetchDbSlots(supabase, tourId);
  const tourRow = await fetchTourRowById(supabase, tourId);
  const seedSlots = tourRow ? seedSlotsFromTourPayload(tourRow) : [];
  return mergeSeedSlots(tourId, dbSlots, seedSlots);
}

export async function upsertTourAvailabilitySlots(
  supabase: DbClient,
  tourId: string,
  slots: SlotUpsertInput[]
): Promise<{ ok: true } | { error: string }> {
  if (!slots.length) return { ok: true };

  const payload = slots
    .map((slot) => {
      const date = toIsoDate(slot.date);
      if (!date) return null;
      const capacity = clampInt(slot.capacity);
      const bookedCount = Math.min(capacity, clampInt(slot.bookedCount ?? 0));
      const status = normalizeSlotStatus(slot.status, capacity, bookedCount);
      return {
        tour_id: tourId,
        date,
        capacity,
        booked_count: bookedCount,
        status,
      };
    })
    .filter((item): item is {
      tour_id: string;
      date: string;
      capacity: number;
      booked_count: number;
      status: TourAvailabilitySlotStatus;
    } => Boolean(item));

  if (!payload.length) return { ok: true };

  const { error } = await supabase
    .from("tour_availability_slots")
    .upsert(payload, { onConflict: "tour_id,date" });

  if (error) return { error: error.message };
  return { ok: true };
}

async function ensureSlotExists(
  supabase: DbClient,
  tourId: string,
  tourSlug: string,
  date: string
): Promise<Database["public"]["Tables"]["tour_availability_slots"]["Row"] | null> {
  const { data: existing } = await supabase
    .from("tour_availability_slots")
    .select("*")
    .eq("tour_id", tourId)
    .eq("date", date)
    .maybeSingle();
  if (existing) return existing;

  const tour = await fetchTourRowBySlug(supabase, tourSlug);
  const seeds = tour ? seedSlotsFromTourPayload(tour) : [];
  const seed = seeds.find((slot) => slot.date === date);
  if (!seed) return null;

  const { data: inserted, error } = await supabase
    .from("tour_availability_slots")
    .insert({
      tour_id: tourId,
      date,
      capacity: seed.capacity,
      booked_count: seed.bookedCount,
      status: seed.status,
    })
    .select("*")
    .maybeSingle();

  if (error) {
    const { data: conflictRow } = await supabase
      .from("tour_availability_slots")
      .select("*")
      .eq("tour_id", tourId)
      .eq("date", date)
      .maybeSingle();
    return conflictRow ?? null;
  }

  return inserted ?? null;
}

export async function reserveTourSlotForBooking(
  supabase: DbClient,
  input: { tourId: string; tourSlug: string; startDate?: string; guests: number }
): Promise<{ reservation: SlotReservation } | { error: string; status?: number } | { reservation: null }> {
  const date = toIsoDate(input.startDate);
  const guests = clampInt(input.guests, 1);
  if (!date || guests < 1) {
    return { reservation: null };
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current =
      (await ensureSlotExists(supabase, input.tourId, input.tourSlug, date)) ??
      (await supabase
        .from("tour_availability_slots")
        .select("*")
        .eq("tour_id", input.tourId)
        .eq("date", date)
        .maybeSingle()).data ??
      null;

    if (!current) {
      // Если слот не найден даже в seed-датах — не блокируем бронирование.
      return { reservation: null };
    }

    const status = normalizeSlotStatus(current.status, current.capacity, current.booked_count);
    if (status !== "open") {
      return { error: "На выбранную дату бронирование закрыто.", status: 409 };
    }

    const available = Math.max(current.capacity - current.booked_count, 0);
    if (available < guests) {
      return {
        error: `Недостаточно мест на выбранную дату: осталось ${available}.`,
        status: 409,
      };
    }

    const nextBooked = current.booked_count + guests;
    const nextStatus: TourAvailabilitySlotStatus =
      nextBooked >= current.capacity ? "sold_out" : "open";

    const { data: updated, error } = await supabase
      .from("tour_availability_slots")
      .update({
        booked_count: nextBooked,
        status: nextStatus,
      })
      .eq("id", current.id)
      .eq("booked_count", current.booked_count)
      .select("id")
      .maybeSingle();

    if (error) {
      return { error: error.message, status: 500 };
    }
    if (!updated) continue;

    return {
      reservation: {
        tourId: input.tourId,
        date,
        guests,
      },
    };
  }

  return {
    error: "Не удалось подтвердить доступность мест. Попробуйте ещё раз.",
    status: 409,
  };
}

export async function releaseTourSlotReservation(
  supabase: DbClient,
  reservation: SlotReservation | null
): Promise<void> {
  if (!reservation) return;

  const { data: current } = await supabase
    .from("tour_availability_slots")
    .select("*")
    .eq("tour_id", reservation.tourId)
    .eq("date", reservation.date)
    .maybeSingle();

  if (!current) return;

  const nextBooked = Math.max(0, current.booked_count - reservation.guests);
  const nextStatus: TourAvailabilitySlotStatus =
    current.status === "closed"
      ? "closed"
      : nextBooked >= current.capacity
        ? "sold_out"
        : "open";

  await supabase
    .from("tour_availability_slots")
    .update({
      booked_count: nextBooked,
      status: nextStatus,
    })
    .eq("id", current.id)
    .eq("booked_count", current.booked_count);
}
