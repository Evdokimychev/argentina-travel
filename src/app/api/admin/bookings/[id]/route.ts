import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchBookingById, updateBookingRecord } from "@/lib/bookings-server";
import { createStatusChange, normalizeBooking } from "@/lib/bookings-store";
import type { BookingStatus } from "@/types/tourist";

type PatchBody = {
  status?: BookingStatus;
  note?: string;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminRequest(_request, "operations.bookings");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const supabase = createSupabaseAdminClient();
  const booking = await fetchBookingById(supabase, id);

  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ booking });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminRequest(request, "operations.bookings");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = (await request.json()) as PatchBody;

  if (!body.status) {
    return NextResponse.json({ error: "Укажите status" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const current = await fetchBookingById(supabase, id);

  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (current.status === body.status) {
    return NextResponse.json({ booking: current });
  }

  const next = normalizeBooking({
    ...current,
    status: body.status,
    statusHistory: [
      ...current.statusHistory,
      createStatusChange({
        from: current.status,
        to: body.status,
        changedBy: "system",
        note: body.note?.trim() || "Изменено администратором",
      }),
    ],
  });

  const result = await updateBookingRecord(supabase, next);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "booking.update_status",
    entityType: "booking",
    entityId: id,
    payload: { from: current.status, to: body.status },
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ booking: result.booking });
}
