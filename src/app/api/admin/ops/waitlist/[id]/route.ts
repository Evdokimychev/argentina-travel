import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATUSES = new Set(["waiting", "contacted", "offered", "converted", "closed", "cancelled"]);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdminRequest(request, "operations.bookings");
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Некорректный идентификатор" }, { status: 400 });
  const body = (await request.json().catch(() => null)) as {
    status?: string;
    version?: number;
    note?: string;
    bookingId?: string;
  } | null;
  if (!body || !STATUSES.has(body.status ?? "") || !Number.isInteger(body.version) || Number(body.version) < 1) {
    return NextResponse.json({ error: "Некорректное изменение" }, { status: 400 });
  }
  if (body.bookingId && !UUID.test(body.bookingId)) {
    return NextResponse.json({ error: "Некорректный номер бронирования" }, { status: 400 });
  }
  const supabase = createSupabaseAdminClient();
  // RPC is installed by the operations queue migration.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("admin_transition_waitlist_entry", {
    p_entry_id: id,
    p_expected_version: body.version,
    p_next_status: body.status,
    p_assigned_to: UUID.test(auth.actorId) ? auth.actorId : null,
    p_note: body.note?.trim().slice(0, 2000) || null,
    p_booking_id: body.bookingId ?? null,
  });
  if (error) {
    const conflict = /version_conflict|invalid_waitlist_transition/i.test(error.message ?? "");
    return NextResponse.json(
      { error: conflict ? "Запись уже изменена. Обновите очередь." : "Не удалось изменить запись" },
      { status: conflict ? 409 : 500 },
    );
  }
  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "waitlist.transition",
    entityType: "tour_waitlist_entry",
    entityId: id,
    payload: { nextStatus: body.status, expectedVersion: body.version, hasBooking: Boolean(body.bookingId) },
    ipAddress: clientIpFromRequest(request),
  });
  return NextResponse.json({ item: data });
}
