import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { rowToBooking, type BookingRow } from "@/lib/bookings-db-mapper";
import { normalizeBooking } from "@/lib/bookings-store";
import type { BookingStatus } from "@/types/tourist";
import type { BookingAttribution } from "@/types/booking-attribution";
import { formatAttributionSourceLabel } from "@/types/booking-attribution";

type DbClient = SupabaseClient<Database>;

export type AdminBookingSummary = {
  id: string;
  tourId: string;
  tourSlug: string;
  tourTitle: string;
  tourImage: string;
  status: BookingStatus;
  guests: number;
  totalPriceUsd: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  startDate: string | null;
  endDate: string | null;
  paymentStatus: string | null;
  operationVersion: number;
  userId: string | null;
  organizerUserId: string | null;
  createdAt: string;
  updatedAt: string;
  attribution?: BookingAttribution;
  attributionLabel?: string;
};

export type AdminBookingsStats = {
  total: number;
  byStatus: Record<string, number>;
};

function toSummary(row: BookingRow): AdminBookingSummary {
  const booking = normalizeBooking(rowToBooking(row));
  return {
    id: booking.id,
    tourId: booking.tourId,
    tourSlug: booking.tourSlug,
    tourTitle: booking.tourTitle,
    tourImage: booking.tourImage,
    status: booking.status,
    guests: booking.guests,
    totalPriceUsd: booking.totalPriceUsd,
    contactName: booking.contactName,
    contactEmail: booking.contactEmail,
    contactPhone: booking.contactPhone,
    startDate: booking.startDate ?? null,
    endDate: booking.endDate ?? null,
    paymentStatus: booking.paymentStatus ?? null,
    operationVersion: row.operation_version ?? 1,
    userId: row.user_id ?? row.guest_user_id,
    organizerUserId: row.organizer_user_id,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    attribution: booking.attribution,
    attributionLabel: formatAttributionSourceLabel(booking.attribution),
  };
}

export async function fetchAllBookingsAdmin(
  supabase: DbClient,
  options?: { status?: string; limit?: number }
): Promise<AdminBookingSummary[]> {
  const limit = options?.limit ?? 200;
  let query = supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as BookingRow[]).map(toSummary);
}

export async function fetchAdminBookingsStats(supabase: DbClient): Promise<AdminBookingsStats> {
  const { data, error } = await supabase.from("bookings").select("status");
  if (error || !data) return { total: 0, byStatus: {} };

  const byStatus: Record<string, number> = {};
  for (const row of data) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
  }
  return { total: data.length, byStatus };
}

export function summarizeBookingsStats(bookings: AdminBookingSummary[]): AdminBookingsStats {
  const byStatus: Record<string, number> = {};
  for (const booking of bookings) {
    byStatus[booking.status] = (byStatus[booking.status] ?? 0) + 1;
  }
  return { total: bookings.length, byStatus };
}

export async function transitionAdminBookingAtomic(
  supabase: DbClient,
  input: {
    bookingId: string;
    expectedVersion: number;
    actorUserId: string;
    nextStatus: BookingStatus;
    note?: string | null;
    ipAddress?: string | null;
  }
): Promise<{ booking: ReturnType<typeof normalizeBooking> } | { error: string; status: number }> {
  const { data, error } = await supabase.rpc("admin_transition_booking_atomic", {
    p_booking_id: input.bookingId,
    p_expected_version: input.expectedVersion,
    p_actor_user_id: input.actorUserId,
    p_next_status: input.nextStatus,
    p_note: input.note?.trim() || null,
    p_ip_address: input.ipAddress ?? null,
  });

  if (error) {
    if (error.code === "40001" || error.message.includes("BOOKING_CONFLICT")) {
      return {
        error: "Заявка уже изменилась в другом окне. Обновите список и повторите действие.",
        status: 409,
      };
    }
    if (error.code === "P0002" || error.message.includes("BOOKING_NOT_FOUND")) {
      return { error: "Заявка не найдена.", status: 404 };
    }
    if (error.message.includes("BOOKING_PAID_STATUS_PAYMENT_OWNED")) {
      return {
        error: "Статус оплаты подтверждает только платёжная система. Проверьте оплату в разделе финансов.",
        status: 409,
      };
    }
    if (error.code === "23514" || error.message.includes("BOOKING_INVALID_TRANSITION")) {
      return {
        error: "Такой переход сейчас недоступен. Обновите заявку и выберите предложенное действие.",
        status: 409,
      };
    }
    if (error.code === "42501") {
      return { error: "Недостаточно прав для изменения бронирования.", status: 403 };
    }
    return { error: "Не удалось изменить статус заявки. Попробуйте ещё раз.", status: 500 };
  }

  if (!data) {
    return { error: "База данных не подтвердила изменение заявки.", status: 500 };
  }
  return { booking: normalizeBooking(rowToBooking(data)) };
}
