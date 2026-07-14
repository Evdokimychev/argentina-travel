import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { logCronResult } from "@/lib/cron/log-cron-result";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { cancelBookingAndReleaseReservation } from "@/lib/bookings-server";
import { normalizeBooking, createStatusChange } from "@/lib/bookings-store";
import { rowToBooking } from "@/lib/bookings-db-mapper";
import { notifyBookingStatusChanged } from "@/lib/bookings-notify";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const CRON_ROUTE = "/api/cron/bookings/expire-unpaid";
const BATCH_LIMIT = 100;

export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;

  const startedAt = Date.now();
  const ranAt = new Date().toISOString();
  const supabase = createSupabaseAdminClient();

  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("status", "waiting_payment")
      .eq("payment_status", "pending")
      .filter("payload->paymentLink->>expiresAt", "lt", ranAt)
      .limit(BATCH_LIMIT);

    if (error) throw error;

    let expired = 0;
    let conflicts = 0;
    for (const row of data ?? []) {
      const current = normalizeBooking(rowToBooking(row));
      const updated = normalizeBooking({
        ...current,
        status: "cancelled",
        paymentLink: current.paymentLink
          ? { ...current.paymentLink, status: "expired" }
          : undefined,
        updatedAt: ranAt,
        statusHistory: [
          ...current.statusHistory,
          createStatusChange({
            from: current.status,
            to: "cancelled",
            changedBy: "system",
            note: "Истёк срок оплаты",
          }),
        ],
      });
      const result = await cancelBookingAndReleaseReservation(
        supabase,
        updated,
        current.updatedAt,
      );
      if ("error" in result) {
        conflicts += 1;
        continue;
      }
      expired += 1;
      void notifyBookingStatusChanged({
        bookingId: updated.id,
        userId: updated.userId,
        tourTitle: updated.tourTitle,
        contactEmail: updated.contactEmail,
        contactName: updated.contactName,
        fromStatus: current.status,
        toStatus: "cancelled",
        changedAt: ranAt,
      });
    }

    const ok = conflicts === 0;
    await logCronResult(CRON_ROUTE, {
      ok,
      ranAt,
      message: ok ? "Expired unpaid bookings released" : "Some unpaid bookings changed concurrently",
      statusCode: ok ? 200 : 409,
      durationMs: Date.now() - startedAt,
      details: { candidates: data?.length ?? 0, expired, conflicts },
    });
    return NextResponse.json(
      { ok, ranAt, candidates: data?.length ?? 0, expired, conflicts },
      { status: ok ? 200 : 409 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Booking expiry failed";
    await logCronResult(CRON_ROUTE, {
      ok: false,
      ranAt,
      message,
      error,
      statusCode: 500,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json({ ok: false, error: message, ranAt }, { status: 500 });
  }
}
