import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { logCronResult } from "@/lib/cron/log-cron-result";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchYouTravelBookingRequestsForStatusSync } from "@/lib/youtravel/booking-requests-server";
import {
  isYouTravelBookingStatusTerminal,
} from "@/lib/youtravel/booking-status";
import { refreshYouTravelBookingStatus } from "@/lib/youtravel/booking-status-sync";
import { isYouTravelConfigured } from "@/lib/youtravel/env";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const CRON_ROUTE = "/api/cron/youtravel-booking-status";
const SYNC_LIMIT = 20;
const LOOKBACK_DAYS = 30;

export async function GET(request: Request) {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv && vercelEnv !== "production") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;

  const startedAt = Date.now();
  const ranAt = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    const summary = { refreshed: 0, failed: 0, skipped: 0, reason: "supabase_not_configured" };
    await logCronResult(CRON_ROUTE, {
      ok: true,
      ranAt,
      message: "YouTravel booking status sync skipped — Supabase not configured",
      statusCode: 200,
      durationMs: Date.now() - startedAt,
      details: summary,
    });
    return NextResponse.json(summary);
  }

  if (!isYouTravelConfigured()) {
    const summary = { refreshed: 0, failed: 0, skipped: 0, reason: "youtravel_not_configured" };
    await logCronResult(CRON_ROUTE, {
      ok: true,
      ranAt,
      message: "YouTravel booking status sync skipped — API not configured",
      statusCode: 200,
      durationMs: Date.now() - startedAt,
      details: summary,
    });
    return NextResponse.json(summary);
  }

  const createdAfter = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const supabase = createSupabaseAdminClient();
  const candidates = await fetchYouTravelBookingRequestsForStatusSync(supabase, {
    limit: SYNC_LIMIT * 2,
    createdAfter,
  });

  let refreshed = 0;
  let failed = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    if (refreshed >= SYNC_LIMIT) break;

    if (!candidate.youtravelOrderId?.trim()) {
      skipped += 1;
      continue;
    }

    if (isYouTravelBookingStatusTerminal(candidate.youtravelStatus)) {
      skipped += 1;
      continue;
    }

    try {
      await refreshYouTravelBookingStatus(supabase, candidate.id);
      refreshed += 1;
    } catch {
      failed += 1;
    }
  }

  const summary = { refreshed, failed, skipped };

  await logCronResult(CRON_ROUTE, {
    ok: failed === 0,
    ranAt,
    message:
      failed > 0
        ? "YouTravel booking status sync completed with errors"
        : "YouTravel booking status sync completed",
    statusCode: failed > 0 ? 500 : 200,
    durationMs: Date.now() - startedAt,
    details: summary,
  });

  return NextResponse.json(summary, { status: failed > 0 ? 500 : 200 });
}
