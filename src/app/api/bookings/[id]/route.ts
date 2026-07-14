import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import {
  assertBookingMutationAllowed,
  cancelBookingAndReleaseReservation,
  canAccessBooking,
  fetchBookingById,
  updateBookingRecord,
} from "@/lib/bookings-server";
import { addBookingBreadcrumb, captureException } from "@/lib/monitoring/sentry";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { notifyBookingStatusChanged } from "@/lib/bookings-notify";
import type { BookingStatus } from "@/types/tourist";
import { normalizeBooking, createStatusChange } from "@/lib/bookings-store";
import { bookingToRow } from "@/lib/bookings-db-mapper";
import {
  dispatchPartnerBookingWebhookEvent,
  resolvePartnerWebhookEventByStatus,
} from "@/lib/partner-webhooks";
import { assertBookingStatusTransition } from "@/lib/booking-state-machine";
import {
  buildBookingPaymentLinkPath,
  createBookingPaymentLinkRecord,
  isBookingPaymentLinkExpired,
} from "@/lib/booking-payment-link";
import { canIssuePaymentLinkForBookingStatus } from "@/lib/payments/payment-integrity";

type PatchBody = {
  action?: "update_status" | "add_comment" | "cancel" | "create_payment_link";
  status?: BookingStatus;
  note?: string;
  comment?: { text: string; authorName: string };
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

    if (body.action === "cancel") {
      const allowed = assertBookingMutationAllowed(current, sessionUser, "cancel");
      if ("error" in allowed) {
        return NextResponse.json({ error: allowed.error }, { status: 403 });
      }

      const transition = assertBookingStatusTransition({
        from: current.status,
        to: "cancelled",
        actor: "tourist",
      });
      if ("error" in transition) {
        return NextResponse.json({ error: transition.error }, { status: 409 });
      }

      const updated = normalizeBooking({
        ...current,
        status: "cancelled",
        paymentLink: current.paymentLink
          ? { ...current.paymentLink, status: "cancelled" }
          : undefined,
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

      const result = await cancelBookingAndReleaseReservation(
        supabase,
        updated,
        current.updatedAt,
      );
      if ("error" in result) {
        addBookingBreadcrumb("booking.cancel.failed", {
          bookingId: id,
          error: result.error,
        });
        return NextResponse.json({ error: result.error }, { status: result.status ?? 500 });
      }

      addBookingBreadcrumb("booking.cancelled", {
        bookingId: id,
        fromStatus: current.status,
        toStatus: "cancelled",
      });

      void notifyBookingStatusChanged({
        bookingId: updated.id,
        userId: updated.userId,
        tourTitle: updated.tourTitle,
        contactEmail: updated.contactEmail,
        contactName: updated.contactName,
        fromStatus: current.status,
        toStatus: "cancelled",
        changedAt: updated.updatedAt,
      });

      void dispatchPartnerBookingWebhookEvent({
        organizerId: bookingToRow(updated).organizer_user_id,
        event: "booking.cancelled",
        booking: updated,
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

      const transition = assertBookingStatusTransition({
        from: current.status,
        to: body.status,
        actor: "organizer",
      });
      if ("error" in transition) {
        return NextResponse.json({ error: transition.error }, { status: 409 });
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
            changedBy: "organizer",
            note: body.note,
          }),
        ],
      });

      const result = await updateBookingRecord(supabase, updated, current.updatedAt);
      if ("error" in result) {
        addBookingBreadcrumb("booking.status_update.failed", {
          bookingId: id,
          fromStatus: current.status,
          toStatus: body.status,
          error: result.error,
        });
        return NextResponse.json({ error: result.error }, { status: result.status ?? 500 });
      }

      addBookingBreadcrumb("booking.status_updated", {
        bookingId: id,
        fromStatus: current.status,
        toStatus: body.status,
      });

      void notifyBookingStatusChanged({
        bookingId: updated.id,
        userId: updated.userId,
        tourTitle: updated.tourTitle,
        contactEmail: updated.contactEmail,
        contactName: updated.contactName,
        fromStatus: current.status,
        toStatus: body.status,
        changedAt: updated.updatedAt,
      });

      const webhookEvent = resolvePartnerWebhookEventByStatus(body.status);
      if (webhookEvent) {
        void dispatchPartnerBookingWebhookEvent({
          organizerId: bookingToRow(updated).organizer_user_id,
          event: webhookEvent,
          booking: updated,
        });
      }

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

      const result = await updateBookingRecord(supabase, updated, current.updatedAt);
      if ("error" in result) {
        addBookingBreadcrumb("booking.comment.failed", {
          bookingId: id,
          error: result.error,
        });
        return NextResponse.json({ error: result.error }, { status: result.status ?? 500 });
      }
      addBookingBreadcrumb("booking.comment_added", {
        bookingId: id,
      });
      return NextResponse.json({ booking: result.booking });
    }

    if (body.action === "create_payment_link") {
      const allowed = assertBookingMutationAllowed(current, sessionUser, "manage");
      if ("error" in allowed) {
        return NextResponse.json({ error: allowed.error }, { status: 403 });
      }
      if (!canIssuePaymentLinkForBookingStatus(current.status)) {
        return NextResponse.json(
          { error: "Ссылку на оплату можно создать после подтверждения заявки." },
          { status: 409 },
        );
      }
      if (
        current.paymentLink?.status === "active" &&
        !isBookingPaymentLinkExpired(current.paymentLink)
      ) {
        return NextResponse.json({
          booking: current,
          paymentLinkPath: buildBookingPaymentLinkPath(current.paymentLink.token),
        });
      }

      const now = new Date().toISOString();
      const paymentLink = createBookingPaymentLinkRecord({
        token: `pay-${randomBytes(24).toString("hex")}`,
        booking: current,
        now,
      });
      const updated = normalizeBooking({
        ...current,
        status: "waiting_payment",
        paymentLink,
        paymentLinkToken: paymentLink.token,
        paymentLinkExpiresAt: paymentLink.expiresAt,
        updatedAt: now,
        statusHistory: current.status === "waiting_payment"
          ? current.statusHistory
          : [
              ...current.statusHistory,
              createStatusChange({
                from: current.status,
                to: "waiting_payment",
                changedBy: "organizer",
              }),
            ],
      });
      const result = await updateBookingRecord(supabase, updated, current.updatedAt);
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: result.status ?? 500 });
      }
      addBookingBreadcrumb("booking.payment_link_created", { bookingId: id });
      return NextResponse.json({
        booking: result.booking,
        paymentLinkPath: buildBookingPaymentLinkPath(paymentLink.token),
      });
    }

    return NextResponse.json({ error: "Invalid patch" }, { status: 400 });
  } catch (error) {
    addBookingBreadcrumb("booking.patch.failed", {
      bookingId: id,
      error: error instanceof Error ? error.message : "Unexpected error",
    });
    captureException(error, { tags: { area: "booking", action: "patch" }, extra: { bookingId: id } });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
