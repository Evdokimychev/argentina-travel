import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import {
  assertBookingMutationAllowed,
  canAccessBooking,
  fetchBookingById,
  updateBookingRecord,
} from "@/lib/bookings-server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { notifyBookingStatusChanged } from "@/lib/bookings-notify";
import type { Booking, BookingStatus, BookingStatusActor } from "@/types/tourist";
import { normalizeBooking, createStatusChange } from "@/lib/bookings-store";

type PatchBody = {
  action?: "update_status" | "add_comment" | "cancel";
  status?: BookingStatus;
  changedBy?: BookingStatusActor;
  note?: string;
  comment?: { text: string; authorName: string };
  booking?: Booking;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json({ error: "Bookings API unavailable" }, { status: 503 });
  }

  const { id } = await context.params;

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);
    const booking = await fetchBookingById(supabase, id);

    if (!booking) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!canAccessBooking(booking, sessionUser, sessionUser?.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json({ error: "Bookings API unavailable" }, { status: 503 });
  }

  const { id } = await context.params;

  try {
    const body = (await request.json()) as PatchBody;
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);
    const current = await fetchBookingById(supabase, id);

    if (!current) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!canAccessBooking(current, sessionUser, sessionUser?.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (body.booking) {
      const allowed = assertBookingMutationAllowed(
        current,
        sessionUser,
        body.action === "cancel" ? "cancel" : "manage"
      );
      if ("error" in allowed) {
        return NextResponse.json({ error: allowed.error }, { status: 403 });
      }

      const result = await updateBookingRecord(supabase, normalizeBooking(body.booking));
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      return NextResponse.json({ booking: result.booking });
    }

    if (body.action === "cancel") {
      const allowed = assertBookingMutationAllowed(current, sessionUser, "cancel");
      if ("error" in allowed) {
        return NextResponse.json({ error: allowed.error }, { status: 403 });
      }

      if (current.status !== "new" && current.status !== "pending") {
        return NextResponse.json({ error: "Эту заявку нельзя отменить" }, { status: 400 });
      }

      const updated = normalizeBooking({
        ...current,
        status: "cancelled",
        updatedAt: new Date().toISOString(),
        statusHistory: [
          ...current.statusHistory,
          createStatusChange({
            from: current.status,
            to: "cancelled",
            changedBy: "tourist",
          }),
        ],
      });

      const result = await updateBookingRecord(supabase, updated);
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      void notifyBookingStatusChanged({
        bookingId: updated.id,
        tourTitle: updated.tourTitle,
        contactEmail: updated.contactEmail,
        contactName: updated.contactName,
        fromStatus: current.status,
        toStatus: "cancelled",
      });

      return NextResponse.json({ booking: result.booking });
    }

    if (body.action === "update_status" && body.status) {
      const allowed = assertBookingMutationAllowed(current, sessionUser, "manage");
      if ("error" in allowed) {
        return NextResponse.json({ error: allowed.error }, { status: 403 });
      }

      if (current.status === body.status) {
        return NextResponse.json({ booking: current });
      }

      const updated = normalizeBooking({
        ...current,
        status: body.status,
        updatedAt: new Date().toISOString(),
        statusHistory: [
          ...current.statusHistory,
          createStatusChange({
            from: current.status,
            to: body.status,
            changedBy: body.changedBy ?? "organizer",
            note: body.note,
          }),
        ],
      });

      const result = await updateBookingRecord(supabase, updated);
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      void notifyBookingStatusChanged({
        bookingId: updated.id,
        tourTitle: updated.tourTitle,
        contactEmail: updated.contactEmail,
        contactName: updated.contactName,
        fromStatus: current.status,
        toStatus: body.status,
      });

      return NextResponse.json({ booking: result.booking });
    }

    if (body.action === "add_comment" && body.comment?.text?.trim()) {
      const allowed = assertBookingMutationAllowed(current, sessionUser, "manage");
      if ("error" in allowed) {
        return NextResponse.json({ error: allowed.error }, { status: 403 });
      }

      const now = new Date().toISOString();
      const updated = normalizeBooking({
        ...current,
        updatedAt: now,
        organizerComments: [
          {
            id: `comment-${Date.now().toString(36)}`,
            text: body.comment.text.trim(),
            authorName: body.comment.authorName.trim() || "Организатор",
            createdAt: now,
          },
          ...current.organizerComments,
        ],
      });

      const result = await updateBookingRecord(supabase, updated);
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      return NextResponse.json({ booking: result.booking });
    }

    return NextResponse.json({ error: "Invalid patch" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
