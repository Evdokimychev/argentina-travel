import { NextResponse } from "next/server";
import {
  notifyBookingCreatedEmail,
  notifyPaymentReceivedEmail,
} from "@/lib/bookings-notify";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const kind = body.kind;
  if (kind === "booking_created") {
    await notifyBookingCreatedEmail({
      userId: typeof body.userId === "string" ? body.userId : null,
      bookingId: String(body.bookingId ?? ""),
      tourTitle: String(body.tourTitle ?? ""),
      contactEmail: String(body.contactEmail ?? ""),
      contactName: String(body.contactName ?? ""),
      guests: typeof body.guests === "number" ? body.guests : undefined,
      startDate: typeof body.startDate === "string" ? body.startDate : null,
      endDate: typeof body.endDate === "string" ? body.endDate : null,
    });
    return NextResponse.json({ ok: true });
  }

  if (kind === "payment_received") {
    const paymentStatus = body.paymentStatus;
    if (paymentStatus !== "paid" && paymentStatus !== "partial" && paymentStatus !== "refunded") {
      return NextResponse.json({ error: "Invalid paymentStatus" }, { status: 400 });
    }
    await notifyPaymentReceivedEmail({
      userId: typeof body.userId === "string" ? body.userId : null,
      bookingId: String(body.bookingId ?? ""),
      tourTitle: String(body.tourTitle ?? ""),
      contactEmail: String(body.contactEmail ?? ""),
      contactName: typeof body.contactName === "string" ? body.contactName : null,
      amountUsd: typeof body.amountUsd === "number" ? body.amountUsd : null,
      paymentStatus,
      providerLabel: typeof body.providerLabel === "string" ? body.providerLabel : null,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
}
