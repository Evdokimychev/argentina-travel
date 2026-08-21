import { NextResponse } from "next/server";
import {
  BOOKING_LOOKUP_MAX_ATTEMPTS,
  BOOKING_LOOKUP_OTP_TTL_MS,
  generateLookupCode,
  hashLookupValue,
  normalizeLookupEmail,
} from "@/lib/booking-lookup-security";
import { sendBookingLookupCodeEmail } from "@/lib/notifications/email-delivery";
import { unexpectedPublicApiError } from "@/lib/public-api/safe-error";
import { checkSecurityRateLimit, getClientIp } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const NEUTRAL_MESSAGE = "Если для этого адреса есть заявки, мы отправили код доступа.";
const UNAVAILABLE_MESSAGE =
  "Поиск заявок временно недоступен. Попробуйте позже или напишите нам через контакты.";

async function audit(challengeId: string | null, event: string, ip: string) {
  const admin = createSupabaseAdminClient();
  await admin.from("booking_lookup_audit_log").insert({
    challenge_id: challengeId,
    event,
    ip_hash: hashLookupValue("ip", ip),
  });
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const ipLimit = await checkSecurityRateLimit(`bookings-lookup:request:ip:${ip}`, 8, 10 * 60_000);
    if (!ipLimit.ok) {
      return NextResponse.json({ ok: true, message: NEUTRAL_MESSAGE }, { status: 202 });
    }

    let email: string | null = null;
    try {
      const body = (await request.json()) as { email?: unknown };
      email = normalizeLookupEmail(typeof body.email === "string" ? body.email : "");
    } catch {
      email = null;
    }

    if (!email) {
      return NextResponse.json({ ok: true, message: NEUTRAL_MESSAGE }, { status: 202 });
    }

    const emailHash = hashLookupValue("email", email);
    const emailLimit = await checkSecurityRateLimit(
      `bookings-lookup:request:email:${emailHash}`,
      3,
      15 * 60_000,
    );
    if (!emailLimit.ok) {
      return NextResponse.json({ ok: true, message: NEUTRAL_MESSAGE }, { status: 202 });
    }

    const admin = createSupabaseAdminClient();
    const { data: rows } = await admin
      .from("bookings")
      .select("id")
      .ilike("contact_email", email)
      .limit(50);
    const bookingIds = rows?.map((row) => row.id) ?? [];
    const code = generateLookupCode();
    const challengeId = crypto.randomUUID();
    const { error } = await admin.from("booking_lookup_challenges").insert({
      id: challengeId,
      email_hash: emailHash,
      code_hash: hashLookupValue(`code:${challengeId}`, code),
      booking_ids: bookingIds,
      expires_at: new Date(Date.now() + BOOKING_LOOKUP_OTP_TTL_MS).toISOString(),
      max_attempts: BOOKING_LOOKUP_MAX_ATTEMPTS,
    });

    if (!error) {
      await audit(challengeId, "lookup_requested", ip);
      if (bookingIds.length > 0) {
        const delivered = await sendBookingLookupCodeEmail({ recipientEmail: email, code });
        await audit(challengeId, delivered ? "otp_delivery_accepted" : "otp_delivery_failed", ip);
      }
    }

    return NextResponse.json(
      { ok: true, requestId: error ? undefined : challengeId, message: NEUTRAL_MESSAGE },
      { status: 202 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("Booking lookup secret") ||
      message.includes("supabase") ||
      message.includes("fetch failed") ||
      message.includes("ECONNREFUSED")
    ) {
      return NextResponse.json(
        { ok: false, error: "Bookings lookup unavailable", message: UNAVAILABLE_MESSAGE },
        { status: 503 },
      );
    }
    console.error("[bookings_lookup_unavailable]", { message });
    return NextResponse.json(
      { ...unexpectedPublicApiError(), message: UNAVAILABLE_MESSAGE },
      { status: 500 },
    );
  }
}
