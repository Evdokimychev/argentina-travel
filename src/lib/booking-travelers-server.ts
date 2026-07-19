import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type { BookingTraveler } from "@/types/tourist";

type DbClient = SupabaseClient<Database>;
type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

export type TravelersFormBookingView = {
  id: string;
  tourSlug: string;
  tourTitle: string;
  guests: number;
  travelers?: BookingTraveler[];
  travelersCompletedAt?: string;
};

export class TravelersFormError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
    this.name = "TravelersFormError";
  }
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function cleanOptionalText(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().slice(0, max);
  return normalized || undefined;
}

function isValidBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
  const today = new Date().toISOString().slice(0, 10);
  return value >= "1900-01-01" && value <= today;
}

export function normalizeRemoteBookingTravelers(
  value: unknown,
  expectedGuests: number
): BookingTraveler[] {
  if (!Array.isArray(value) || value.length !== expectedGuests || expectedGuests < 1 || expectedGuests > 50) {
    throw new TravelersFormError("Заполните данные всех участников поездки");
  }
  return value.map((raw, index) => {
    const source = record(raw);
    const fullName = cleanOptionalText(source.fullName, 160);
    const dateOfBirth = cleanOptionalText(source.dateOfBirth, 10);
    if (!fullName || fullName.length < 2 || !dateOfBirth || !isValidBirthDate(dateOfBirth)) {
      throw new TravelersFormError(`Проверьте ФИО и дату рождения участника №${index + 1}`);
    }
    const email = cleanOptionalText(source.email, 254)?.toLowerCase();
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      throw new TravelersFormError(`Проверьте email участника №${index + 1}`);
    }
    return {
      id: `guest-${index + 1}`,
      fullName,
      dateOfBirth,
      dietaryRestrictions: cleanOptionalText(source.dietaryRestrictions, 500),
      email,
      phone: cleanOptionalText(source.phone, 60),
    };
  });
}

function viewFromRow(row: BookingRow): TravelersFormBookingView {
  const payload = record(row.payload);
  return {
    id: row.id,
    tourSlug: row.tour_slug,
    tourTitle: row.tour_title,
    guests: row.guests,
    travelers: Array.isArray(payload.travelers)
      ? payload.travelers as unknown as BookingTraveler[]
      : undefined,
    travelersCompletedAt:
      typeof payload.travelersCompletedAt === "string"
        ? payload.travelersCompletedAt
        : undefined,
  };
}

function validateToken(token: string): void {
  if (!/^travelers-[a-f0-9]{32}$/.test(token)) {
    throw new TravelersFormError("Ссылка недействительна или заявка не найдена", 404);
  }
}

async function findBookingRow(admin: DbClient, token: string): Promise<BookingRow | null> {
  validateToken(token);
  const { data, error } = await admin
    .from("bookings")
    .select("*")
    .filter("payload->>travelersFormToken", "eq", token)
    .maybeSingle();
  if (error) throw new TravelersFormError(error.message, 500);
  return data;
}

export async function fetchTravelersFormBooking(
  admin: DbClient,
  token: string
): Promise<TravelersFormBookingView | null> {
  const row = await findBookingRow(admin, token);
  return row ? viewFromRow(row) : null;
}

export async function saveTravelersFormBooking(input: {
  admin: DbClient;
  token: string;
  travelers: unknown;
}): Promise<TravelersFormBookingView | null> {
  const row = await findBookingRow(input.admin, input.token);
  if (!row) return null;
  const travelers = normalizeRemoteBookingTravelers(input.travelers, row.guests);
  const payload = record(row.payload);
  const completedAt = new Date().toISOString();
  const { data, error } = await input.admin
    .from("bookings")
    .update({
      payload: {
        ...payload,
        travelers,
        fillTravelersLater: false,
        travelersCompletedAt: completedAt,
      } as unknown as Json,
    })
    .eq("id", row.id)
    .eq("updated_at", row.updated_at)
    .select("*")
    .maybeSingle();
  if (error) throw new TravelersFormError(error.message, 500);
  if (!data) {
    throw new TravelersFormError("Заявка была обновлена. Перезагрузите страницу и повторите отправку.", 409);
  }
  return viewFromRow(data);
}
