import { NextResponse } from "next/server";
import {
  BOOKING_LOOKUP_COOKIE,
  BOOKING_LOOKUP_SESSION_TTL_MS,
  generateLookupSessionToken,
  hashLookupValue,
} from "@/lib/booking-lookup-security";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const INVALID_MESSAGE = "Код неверен или истёк. Запросите новый код.";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = await checkRateLimit(`bookings-lookup:verify:ip:${ip}`, 15, 10 * 60_000);
  if (!limit.ok) return NextResponse.json({ error: INVALID_MESSAGE }, { status: 400 });

  let requestId = "";
  let code = "";
  try {
    const body = (await request.json()) as { requestId?: unknown; code?: unknown };
    requestId = typeof body.requestId === "string" ? body.requestId : "";
    code = typeof body.code === "string" ? body.code.replace(/\D/g, "") : "";
  } catch {
    // Return the same safe response for malformed input.
  }
  if (!/^[0-9a-f-]{36}$/i.test(requestId) || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: INVALID_MESSAGE }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const token = generateLookupSessionToken();
  const sessionExpiresAt = new Date(Date.now() + BOOKING_LOOKUP_SESSION_TTL_MS);
  const { data, error } = await admin.rpc("consume_booking_lookup_challenge", {
    p_challenge_id: requestId,
    p_code_hash: hashLookupValue(`code:${requestId}`, code),
    p_session_token_hash: hashLookupValue("session", token),
    p_session_expires_at: sessionExpiresAt.toISOString(),
  });
  const outcome = data?.[0];

  if (error || outcome?.status !== "accepted") {
    if (outcome?.status === "rejected") {
      await admin.from("booking_lookup_audit_log").insert({
        challenge_id: requestId,
        event: "otp_rejected",
        ip_hash: hashLookupValue("ip", ip),
        metadata: { attempts: outcome.attempts },
      });
    }
    return NextResponse.json({ error: INVALID_MESSAGE }, { status: 400 });
  }

  await admin.from("booking_lookup_audit_log").insert({
    challenge_id: requestId,
    event: "lookup_session_created",
    ip_hash: hashLookupValue("ip", ip),
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(BOOKING_LOOKUP_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/bookings/lookup",
    expires: sessionExpiresAt,
  });
  return response;
}
