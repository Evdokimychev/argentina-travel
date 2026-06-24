import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { logCronResult } from "@/lib/cron/log-cron-result";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchAffiseDailyTotals } from "@/lib/youtravel/affise-client";
import { insertAffiseDailySnapshot } from "@/lib/youtravel/affise-snapshots-server";
import { isYouTravelAffiseConfigured } from "@/lib/youtravel/env";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CRON_ROUTE = "/api/cron/youtravel-affise-snapshot";

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function resolveSnapshotDate(): string {
  const today = new Date();
  return formatIsoDate(new Date(today.getTime() - 24 * 60 * 60 * 1000));
}

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
    const summary = { upserted: false, reason: "supabase_not_configured" };
    await logCronResult(CRON_ROUTE, {
      ok: true,
      ranAt,
      message: "YouTravel Affise snapshot skipped — Supabase not configured",
      statusCode: 200,
      durationMs: Date.now() - startedAt,
      details: summary,
    });
    return NextResponse.json(summary);
  }

  if (!isYouTravelAffiseConfigured()) {
    const summary = { upserted: false, reason: "affise_not_configured" };
    await logCronResult(CRON_ROUTE, {
      ok: true,
      ranAt,
      message: "YouTravel Affise snapshot skipped — API key not configured",
      statusCode: 200,
      durationMs: Date.now() - startedAt,
      details: summary,
    });
    return NextResponse.json(summary);
  }

  const snapshotDate = resolveSnapshotDate();

  try {
    const totals = await fetchAffiseDailyTotals(snapshotDate);
    const supabase = createSupabaseAdminClient();
    await insertAffiseDailySnapshot(supabase, {
      snapshotDate,
      conversions: totals.conversions,
      clicks: totals.clicks,
    });

    const summary = {
      upserted: true,
      snapshotDate,
      conversions: totals.conversions,
      clicks: totals.clicks,
    };

    await logCronResult(CRON_ROUTE, {
      ok: true,
      ranAt,
      message: "YouTravel Affise snapshot completed",
      statusCode: 200,
      durationMs: Date.now() - startedAt,
      details: summary,
    });

    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Affise snapshot failed";
    await logCronResult(CRON_ROUTE, {
      ok: false,
      ranAt,
      message,
      error,
      statusCode: 500,
      durationMs: Date.now() - startedAt,
      details: { snapshotDate },
    });
    return NextResponse.json({ upserted: false, error: message, snapshotDate }, { status: 500 });
  }
}
