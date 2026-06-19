import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { BookingAttribution } from "@/types/booking-attribution";
import type { TopAttributionSourceRow } from "@/types/admin-analytics";
import { hasAttributionData } from "@/types/booking-attribution";

type DbClient = SupabaseClient<Database>;

function mapAttributionRow(
  row: Database["public"]["Tables"]["booking_attribution"]["Row"]
): BookingAttribution {
  return {
    utmSource: row.utm_source ?? undefined,
    utmMedium: row.utm_medium ?? undefined,
    utmCampaign: row.utm_campaign ?? undefined,
    referrer: row.referrer ?? undefined,
    landingPath: row.landing_path ?? undefined,
    apiKeyId: row.api_key_id ?? undefined,
    capturedAt: row.created_at,
  };
}

export async function insertBookingAttribution(
  supabase: DbClient,
  bookingId: string,
  attribution: BookingAttribution
): Promise<void> {
  if (!hasAttributionData(attribution)) return;

  const { error } = await supabase.from("booking_attribution").insert({
    booking_id: bookingId,
    utm_source: attribution.utmSource ?? null,
    utm_medium: attribution.utmMedium ?? null,
    utm_campaign: attribution.utmCampaign ?? null,
    referrer: attribution.referrer ?? null,
    landing_path: attribution.landingPath ?? null,
    api_key_id: attribution.apiKeyId ?? null,
  });

  if (error && !error.message.includes("duplicate")) {
    console.error("[booking_attribution] insert failed:", error.message);
  }
}

export async function fetchBookingAttribution(
  supabase: DbClient,
  bookingId: string
): Promise<BookingAttribution | null> {
  const { data } = await supabase
    .from("booking_attribution")
    .select("*")
    .eq("booking_id", bookingId)
    .maybeSingle();

  return data ? mapAttributionRow(data) : null;
}

export async function fetchAttributionByBookingIds(
  supabase: DbClient,
  bookingIds: string[]
): Promise<Map<string, BookingAttribution>> {
  const map = new Map<string, BookingAttribution>();
  if (!bookingIds.length) return map;

  const { data } = await supabase
    .from("booking_attribution")
    .select("*")
    .in("booking_id", bookingIds);

  for (const row of data ?? []) {
    map.set(row.booking_id, mapAttributionRow(row));
  }
  return map;
}

export async function fetchTopAttributionSources(
  supabase: DbClient,
  since: string | null,
  limit = 10
): Promise<TopAttributionSourceRow[]> {
  let query = supabase
    .from("booking_attribution")
    .select("utm_source, booking_id, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (since) {
    query = query.gte("created_at", since);
  }

  const { data } = await query;
  if (!data?.length) return [];

  const counts = new Map<string, number>();
  for (const row of data) {
    const key = row.utm_source?.trim() || "(direct)";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([sourceKey, count]) => ({
      sourceKey,
      label: sourceKey === "(direct)" ? "Прямой заход" : sourceKey,
      count,
    }));
}
