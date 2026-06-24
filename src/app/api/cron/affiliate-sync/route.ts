import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { logCronResult } from "@/lib/cron/log-cron-result";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
const CRON_ROUTE = "/api/cron/affiliate-sync";

/** Runs Tripster then Sputnik8 catalog sync (single cron slot for Hobby plans). */
export async function GET(request: Request) {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv && vercelEnv !== "production") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;
  const startedAt = Date.now();
  const ranAt = new Date().toISOString();

  try {
    const origin = new URL(request.url).origin;
    const headers: HeadersInit = { "x-vercel-cron": "1" };

    const tripsterRes = await fetch(`${origin}/api/cron/tripster-sync`, { headers });
    const tripster = await tripsterRes.json();

    const sputnikRes = await fetch(`${origin}/api/cron/sputnik8-sync`, { headers });
    const sputnik8 = await sputnikRes.json();

    const youtravelRes = await fetch(`${origin}/api/cron/youtravel-sync`, { headers });
    const youtravel = await youtravelRes.json();

    const youtravelAffiseRes = await fetch(`${origin}/api/cron/youtravel-affise-snapshot`, {
      headers,
    });
    const youtravelAffise = await youtravelAffiseRes.json().catch(() => null);

    const youtravelBookingRes = await fetch(`${origin}/api/cron/youtravel-booking-status`, {
      headers,
    });
    const youtravelBooking = await youtravelBookingRes.json().catch(() => null);

    const ok = tripsterRes.ok && sputnikRes.ok && youtravelRes.ok;
    await logCronResult(CRON_ROUTE, {
      ok,
      ranAt,
      statusCode: ok ? 200 : 500,
      durationMs: Date.now() - startedAt,
      message: ok ? "Affiliate sync completed" : "Affiliate sync has failed providers",
      details: {
        tripsterOk: tripsterRes.ok,
        sputnik8Ok: sputnikRes.ok,
        youtravelOk: youtravelRes.ok,
        youtravelAffiseOk: youtravelAffiseRes.ok,
        youtravelBookingOk: youtravelBookingRes.ok,
      },
    });

    return NextResponse.json(
      { ok, tripster, sputnik8, youtravel, youtravelAffise, youtravelBooking },
      { status: ok ? 200 : 500 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Affiliate sync failed";
    await logCronResult(CRON_ROUTE, {
      ok: false,
      ranAt,
      message,
      error,
      statusCode: 500,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
