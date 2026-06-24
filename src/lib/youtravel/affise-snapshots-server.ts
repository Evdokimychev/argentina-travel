import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { AffiseSnapshotDays, AffiseSnapshotRow } from "@/lib/youtravel/affise-snapshots";

export type {
  AffiseConversionDropAlert,
  AffiseHistoryPoint,
  AffiseSnapshotDays,
  AffiseSnapshotRow,
} from "@/lib/youtravel/affise-snapshots";

export {
  buildAffiseHistoryResponse,
  detectAffiseConversionDropAlert,
  fillAffiseHistoryDays,
  hasAffiseHistoryData,
  historyHasClicksData,
  sumHistoryClicks,
  sumHistoryConversions,
} from "@/lib/youtravel/affise-snapshots";

type DbClient = SupabaseClient<Database>;

const AFFISE_SOURCE = "affise";

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return formatIsoDate(next);
}

function mapRow(row: {
  snapshot_date: string;
  conversions: number;
  clicks: number | null;
}): AffiseSnapshotRow {
  return {
    snapshotDate: row.snapshot_date,
    conversions: row.conversions,
    clicks: row.clicks,
  };
}

export async function insertAffiseDailySnapshot(
  supabase: DbClient,
  input: { snapshotDate: string; conversions: number; clicks: number | null }
): Promise<void> {
  const { error } = await supabase.from("youtravel_affise_snapshots").upsert(
    {
      snapshot_date: input.snapshotDate,
      conversions: Math.max(0, input.conversions),
      clicks: input.clicks,
      source: AFFISE_SOURCE,
    },
    { onConflict: "snapshot_date,source" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchAffiseSnapshots(
  supabase: DbClient,
  options: { days: AffiseSnapshotDays }
): Promise<AffiseSnapshotRow[]> {
  const endDate = formatIsoDate(new Date());
  const startDate = addDays(endDate, -(options.days - 1));

  const { data, error } = await supabase
    .from("youtravel_affise_snapshots")
    .select("snapshot_date, conversions, clicks")
    .eq("source", AFFISE_SOURCE)
    .gte("snapshot_date", startDate)
    .lte("snapshot_date", endDate)
    .order("snapshot_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapRow);
}

export async function fetchLatestAffiseSnapshot(
  supabase: DbClient
): Promise<AffiseSnapshotRow | null> {
  const { data, error } = await supabase
    .from("youtravel_affise_snapshots")
    .select("snapshot_date, conversions, clicks")
    .eq("source", AFFISE_SOURCE)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapRow(data) : null;
}
