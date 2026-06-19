import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { BookingPaymentStatus } from "@/types/booking-params";
import type {
  AdminPaymentPeriodFilter,
  AdminPaymentStatusFilter,
  AdminPaymentsSummaryStats,
  BookingPaymentOverview,
} from "@/types/admin-payments";
import { periodStartIso } from "@/lib/admin/analytics-period";
import { rowToBooking, type BookingRow } from "@/lib/bookings-db-mapper";
import { normalizeBooking } from "@/lib/bookings-store";
import { resolveBookingPaymentStatus, resolveOrganizerParams } from "@/lib/booking-params";
import { resolveBookingPaymentSummary } from "@/lib/booking-payment";
import { isBookingPaymentLinkExpired } from "@/lib/booking-payment-link";

type DbClient = SupabaseClient<Database>;

const PAYMENT_STATUSES: BookingPaymentStatus[] = ["pending", "partial", "paid", "refunded"];

function emptyStats(): AdminPaymentsSummaryStats {
  return {
    byStatus: {
      pending: 0,
      partial: 0,
      paid: 0,
      refunded: 0,
    },
    totalDue: 0,
    totalPaid: 0,
  };
}

function toOverview(row: BookingRow): BookingPaymentOverview {
  const booking = normalizeBooking(rowToBooking(row));
  const paymentStatus = resolveBookingPaymentStatus(booking);
  const paymentSummary = resolveBookingPaymentSummary(booking);
  const organizerParams = resolveOrganizerParams(booking);
  const paymentLink = booking.paymentLink;

  const paymentLinkStatus = paymentLink
    ? isBookingPaymentLinkExpired(paymentLink) && paymentLink.status === "active"
      ? "expired"
      : paymentLink.status
    : "none";

  return {
    bookingId: booking.id,
    tourTitle: booking.tourTitle,
    contactEmail: booking.contactEmail,
    paymentStatus,
    amountDue: Math.max(0, booking.amountDue ?? paymentSummary.remainingAmountUsd),
    amountPaid: Math.max(0, booking.amountPaid ?? paymentSummary.paidAmountUsd),
    currency: organizerParams.currency,
    checkoutPaymentOption: booking.checkoutPaymentOption ?? null,
    paymentLinkStatus,
    organizerUserId: row.organizer_user_id ?? null,
  };
}

export async function fetchAdminPaymentOverview(
  supabase: DbClient,
  filters?: { status?: AdminPaymentStatusFilter; period?: AdminPaymentPeriodFilter }
): Promise<BookingPaymentOverview[]> {
  const period = filters?.period ?? "30d";
  const since = periodStartIso(period);
  const status = filters?.status ?? "all";

  let query = supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (since) {
    query = query.gte("created_at", since);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const overview = (data as BookingRow[]).map(toOverview);
  if (status === "all") return overview;
  return overview.filter((row) => row.paymentStatus === status);
}

export function summarizeAdminPaymentOverview(
  rows: BookingPaymentOverview[]
): AdminPaymentsSummaryStats {
  const stats = emptyStats();

  for (const row of rows) {
    if (PAYMENT_STATUSES.includes(row.paymentStatus)) {
      stats.byStatus[row.paymentStatus] += 1;
    }
    stats.totalDue += row.amountDue;
    stats.totalPaid += row.amountPaid;
  }

  return {
    byStatus: stats.byStatus,
    totalDue: Math.round(stats.totalDue),
    totalPaid: Math.round(stats.totalPaid),
  };
}
