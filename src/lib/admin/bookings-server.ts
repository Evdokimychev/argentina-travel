import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { rowToBooking, type BookingRow } from "@/lib/bookings-db-mapper";
import { normalizeBooking } from "@/lib/bookings-store";
import type { BookingStatus } from "@/types/tourist";

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
  userId: string | null;
  organizerUserId: string | null;
  createdAt: string;
  updatedAt: string;
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
    userId: row.user_id ?? row.guest_user_id,
    organizerUserId: row.organizer_user_id,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
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
