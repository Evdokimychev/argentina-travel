import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest } from "@/lib/admin/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchBookingById } from "@/lib/bookings-server";
import { notifyBookingStatusChanged } from "@/lib/bookings-notify";
import { bookingToRow } from "@/lib/bookings-db-mapper";
import {
  dispatchPartnerBookingWebhookEvent,
  resolvePartnerWebhookEventByStatus,
} from "@/lib/partner-webhooks";
import type { BookingStatus } from "@/types/tourist";
import { BOOKING_STATUSES_ADMIN } from "@/data/booking-statuses";
import { transitionAdminBookingAtomic } from "@/lib/admin/bookings-server";

type PatchBody = {
  status?: BookingStatus;
  note?: string;
  expectedVersion?: number;
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
    return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
  }

  return NextResponse.json({ booking });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminRequest(request, "operations.bookings");
  if (!auth.ok) return auth.response;
  if (auth.via !== "session") {
    return NextResponse.json(
      { error: "Изменение бронирования доступно только авторизованному сотруднику." },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as PatchBody | null;

  if (!body?.status || !BOOKING_STATUSES_ADMIN.includes(body.status)) {
    return NextResponse.json({ error: "Выберите допустимый статус заявки." }, { status: 400 });
  }
  if (!Number.isSafeInteger(body.expectedVersion) || (body.expectedVersion ?? 0) < 1) {
    return NextResponse.json(
      { error: "Обновите список заявок и повторите действие." },
      { status: 409 },
    );
  }
  if ((body.note?.length ?? 0) > 1000) {
    return NextResponse.json({ error: "Комментарий слишком длинный." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const current = await fetchBookingById(supabase, id);

  if (!current) {
    return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
  }

  if (current.status === body.status) {
    return NextResponse.json({ booking: current });
  }

  const result = await transitionAdminBookingAtomic(supabase, {
    bookingId: id,
    expectedVersion: body.expectedVersion!,
    actorUserId: auth.actorId,
    nextStatus: body.status,
    note: body.note,
    ipAddress: clientIpFromRequest(request),
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  void notifyBookingStatusChanged({
    bookingId: id,
    userId: result.booking.userId,
    tourTitle: result.booking.tourTitle,
    contactEmail: result.booking.contactEmail,
    contactName: result.booking.contactName,
    fromStatus: current.status,
    toStatus: body.status,
    changedAt: result.booking.updatedAt,
  });

  const webhookEvent = resolvePartnerWebhookEventByStatus(body.status);
  if (webhookEvent) {
    void dispatchPartnerBookingWebhookEvent({
      organizerId: bookingToRow(result.booking).organizer_user_id,
      event: webhookEvent,
      booking: result.booking,
    });
  }

  return NextResponse.json({ booking: result.booking });
}
