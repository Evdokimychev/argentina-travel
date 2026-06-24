import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchAffiseConversionSummary } from "@/lib/youtravel/affise-client";
import {
  buildAffiseHistoryResponse,
  fetchAffiseSnapshots,
  hasAffiseHistoryData,
  sumHistoryClicks,
  sumHistoryConversions,
  type AffiseConversionDropAlert,
  type AffiseHistoryPoint,
} from "@/lib/youtravel/affise-snapshots-server";
import { isYouTravelAffiseConfigured } from "@/lib/youtravel/env";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "marketplace.excursions");
  if (!auth.ok) return auth.response;

  if (!isYouTravelAffiseConfigured()) {
    return NextResponse.json({
      configured: false,
      history: { points7: [], points30: [], points90: [] },
    });
  }

  let live: Awaited<ReturnType<typeof fetchAffiseConversionSummary>> | undefined;
  let liveError: string | undefined;

  try {
    live = await fetchAffiseConversionSummary();
  } catch (error) {
    liveError = error instanceof Error ? error.message : "Affise API unavailable";
  }

  let history: {
    points7: AffiseHistoryPoint[];
    points30: AffiseHistoryPoint[];
    points90: AffiseHistoryPoint[];
  } = { points7: [], points30: [], points90: [] };
  let alert: AffiseConversionDropAlert | undefined;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createSupabaseAdminClient();
      const snapshots = await fetchAffiseSnapshots(supabase, { days: 90 });
      const built = buildAffiseHistoryResponse(snapshots);
      history = {
        points7: built.points7,
        points30: built.points30,
        points90: built.points90,
      };
      alert = built.alert ?? undefined;
    } catch {
      // History is optional — live stats remain available as fallback.
    }
  }

  const historyHasData =
    hasAffiseHistoryData(history.points90) ||
    hasAffiseHistoryData(history.points30) ||
    hasAffiseHistoryData(history.points7);

  const last7Days = historyHasData
    ? {
        conversions: sumHistoryConversions(history.points7),
        clicks: sumHistoryClicks(history.points7),
      }
    : live?.last7Days;

  const last30Days = historyHasData
    ? {
        conversions: sumHistoryConversions(history.points30),
        clicks: sumHistoryClicks(history.points30),
      }
    : live?.last30Days;

  if (liveError && !historyHasData) {
    return NextResponse.json(
      {
        configured: true,
        error: liveError,
        history,
        last7Days: last7Days ?? { conversions: 0, clicks: null },
        last30Days: last30Days ?? { conversions: 0, clicks: null },
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    configured: true,
    live,
    history,
    alert,
    last7Days,
    last30Days,
    ...(liveError ? { error: liveError } : {}),
  });
}
