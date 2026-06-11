import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Booking } from "@/types/tourist";
import type { SessionUser } from "@/types/user";
import { bookingToRow, rowToBooking, rowsToBookings } from "@/lib/bookings-db-mapper";
import { normalizeBooking } from "@/lib/bookings-store";
import { bookingMatchesContactEmail, isGuestUserId } from "@/lib/guest-booking";
import { getOrganizerTourOwnerId } from "@/lib/organizer-tour-store";
import { getOrganizerCatalogSlugs } from "@/lib/organizer-bookings";
import { canManageBooking, canCancelOwnBooking } from "@/lib/permissions";
import { userHasAccountRole } from "@/types/user";

type DbClient = SupabaseClient<Database>;

export function normalizeBookingsFromRows(
  rows: Parameters<typeof rowsToBookings>[0]
): Booking[] {
  return rowsToBookings(rows).map((booking) => normalizeBooking(booking));
}

export async function fetchBookingById(
  supabase: DbClient,
  bookingId: string
): Promise<Booking | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();

  if (error || !data) return null;
  return normalizeBooking(rowToBooking(data));
}

export async function fetchUserBookings(
  supabase: DbClient,
  userId: string
): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return normalizeBookingsFromRows(data);
}

export async function fetchOrganizerBookings(
  supabase: DbClient,
  organizerUserId: string,
  tourSlugs?: string[]
): Promise<Booking[]> {
  const byId = new Map<string, Booking>();

  const { data: ownerRows } = await supabase
    .from("bookings")
    .select("*")
    .eq("organizer_user_id", organizerUserId)
    .order("created_at", { ascending: false });

  if (ownerRows?.length) {
    for (const booking of normalizeBookingsFromRows(ownerRows)) {
      byId.set(booking.id, booking);
    }
  }

  if (tourSlugs?.length) {
    const { data: slugRows } = await supabase
      .from("bookings")
      .select("*")
      .in("tour_slug", tourSlugs)
      .order("created_at", { ascending: false });

    if (slugRows?.length) {
      for (const booking of normalizeBookingsFromRows(slugRows)) {
        byId.set(booking.id, booking);
      }
    }
  }

  return Array.from(byId.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function organizerCanAccessBooking(
  booking: Booking,
  organizerUserId: string,
  tourSlugs: string[] = getOrganizerCatalogSlugs(organizerUserId)
): boolean {
  if (booking.organizerTourId) {
    const tourOwnerUserId = getOrganizerTourOwnerId(booking.organizerTourId);
    if (tourOwnerUserId === organizerUserId) return true;
  }
  return tourSlugs.includes(booking.tourSlug);
}

export function canAccessBooking(
  booking: Booking,
  actor: SessionUser | null,
  profileEmail?: string | null
): boolean {
  if (!actor) return false;

  if (booking.userId === actor.id) return true;

  const email = profileEmail ?? actor.email;
  if (email && bookingMatchesContactEmail(booking, email)) return true;

  if (userHasAccountRole(actor, "organizer") || userHasAccountRole(actor, "admin")) {
    if (organizerCanAccessBooking(booking, actor.id)) {
      return true;
    }
    const tourOwnerUserId = booking.organizerTourId
      ? getOrganizerTourOwnerId(booking.organizerTourId)
      : undefined;
    return canManageBooking(actor, { tourOwnerUserId, bookingUserId: booking.userId });
  }

  return false;
}

export async function insertBooking(
  supabase: DbClient,
  booking: Booking
): Promise<{ booking: Booking } | { error: string }> {
  const row = bookingToRow(booking);
  const { error } = await supabase.from("bookings").insert(row);

  if (error) {
    return { error: error.message };
  }

  return { booking: normalizeBooking(booking) };
}

export async function updateBookingRecord(
  supabase: DbClient,
  booking: Booking
): Promise<{ booking: Booking } | { error: string }> {
  const row = bookingToRow(booking);
  const { error } = await supabase
    .from("bookings")
    .update({
      user_id: row.user_id,
      guest_user_id: row.guest_user_id,
      status: row.status,
      payment_status: row.payment_status,
      payload: row.payload,
      start_date: row.start_date,
      end_date: row.end_date,
      total_price_usd: row.total_price_usd,
      updated_at: row.updated_at,
    })
    .eq("id", booking.id);

  if (error) {
    return { error: error.message };
  }

  return { booking: normalizeBooking(booking) };
}

export async function attachGuestBookingsByEmail(
  supabase: DbClient,
  userId: string,
  email: string
): Promise<number> {
  if (isGuestUserId(userId)) return 0;

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return 0;

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .is("user_id", null)
    .ilike("contact_email", normalizedEmail);

  if (error || !data?.length) return 0;

  let attached = 0;
  for (const row of data) {
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        user_id: userId,
        guest_user_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (!updateError) attached += 1;
  }

  return attached;
}

export function assertBookingMutationAllowed(
  booking: Booking,
  actor: SessionUser | null,
  action: "cancel" | "manage"
): { ok: true } | { error: string } {
  if (!actor) return { error: "Войдите в аккаунт" };

  if (action === "cancel") {
    if (
      !canCancelOwnBooking(actor, booking.userId) &&
      !(actor.email && bookingMatchesContactEmail(booking, actor.email))
    ) {
      return { error: "Нет доступа" };
    }
    return { ok: true };
  }

  if (userHasAccountRole(actor, "organizer") && organizerCanAccessBooking(booking, actor.id)) {
    return { ok: true };
  }

  const tourOwnerUserId = booking.organizerTourId
    ? getOrganizerTourOwnerId(booking.organizerTourId)
    : undefined;

  if (!canManageBooking(actor, { tourOwnerUserId, bookingUserId: booking.userId })) {
    return { error: "Нет доступа" };
  }

  return { ok: true };
}
