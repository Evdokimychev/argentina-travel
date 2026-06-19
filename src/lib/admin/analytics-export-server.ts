import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { periodStartIso } from "@/lib/admin/analytics-period";
import type { AnalyticsExportType, AnalyticsPeriod } from "@/types/admin-analytics";

type DbClient = SupabaseClient<Database>;

function applySince<T extends { gte: (col: string, val: string) => T }>(
  query: T,
  since: string | null,
  column = "created_at"
): T {
  return since ? query.gte(column, since) : query;
}

function csvEscape(value: string | number | null | undefined): string {
  const text = value == null ? "" : String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

async function exportBookingsCsv(
  supabase: DbClient,
  since: string | null
): Promise<string> {
  let query = supabase
    .from("bookings")
    .select(
      "id,tour_title,tour_slug,status,contact_name,contact_email,contact_phone,guests,total_price_usd,payment_status,created_at"
    )
    .order("created_at", { ascending: false })
    .limit(5000);
  query = applySince(query, since);
  const { data } = await query;

  const lines = [
    "id,tour_title,tour_slug,status,contact_name,contact_email,contact_phone,guests,total_price_usd,payment_status,created_at",
  ];

  for (const row of data ?? []) {
    lines.push(
      [
        csvEscape(row.id),
        csvEscape(row.tour_title),
        csvEscape(row.tour_slug),
        csvEscape(row.status),
        csvEscape(row.contact_name),
        csvEscape(row.contact_email),
        csvEscape(row.contact_phone),
        csvEscape(row.guests),
        csvEscape(row.total_price_usd),
        csvEscape(row.payment_status),
        row.created_at,
      ].join(",")
    );
  }

  return lines.join("\n");
}

async function exportReviewsCsv(supabase: DbClient, since: string | null): Promise<string> {
  let query = supabase
    .from("tourist_reviews")
    .select("id,tour_slug,tour_title,rating,review_text,status,booking_id,created_at")
    .order("created_at", { ascending: false })
    .limit(5000);
  query = applySince(query, since);
  const { data } = await query;

  const lines = ["id,tour_slug,tour_title,rating,review_text,status,booking_id,created_at"];

  for (const row of data ?? []) {
    lines.push(
      [
        csvEscape(row.id),
        csvEscape(row.tour_slug),
        csvEscape(row.tour_title),
        csvEscape(row.rating),
        csvEscape(row.review_text),
        csvEscape(row.status),
        csvEscape(row.booking_id),
        row.created_at,
      ].join(",")
    );
  }

  return lines.join("\n");
}

async function exportPaymentsCsv(supabase: DbClient, since: string | null): Promise<string> {
  let query = supabase
    .from("payment_transactions")
    .select("id,booking_id,provider,external_id,amount,currency,status,type,created_at")
    .order("created_at", { ascending: false })
    .limit(5000);
  query = applySince(query, since);
  const { data } = await query;

  const lines = [
    "id,booking_id,provider,external_id,amount,currency,status,type,created_at",
  ];

  for (const row of data ?? []) {
    lines.push(
      [
        csvEscape(row.id),
        csvEscape(row.booking_id),
        csvEscape(row.provider),
        csvEscape(row.external_id),
        csvEscape(row.amount),
        csvEscape(row.currency),
        csvEscape(row.status),
        csvEscape(row.type),
        row.created_at,
      ].join(",")
    );
  }

  return lines.join("\n");
}

export function buildExportFilename(type: AnalyticsExportType, period: AnalyticsPeriod): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `analytics-${type}-${period}-${stamp}.csv`;
}

export function parseAnalyticsExportType(value: string | null): AnalyticsExportType | null {
  if (value === "bookings" || value === "reviews" || value === "payments") return value;
  return null;
}

export async function fetchAdminAnalyticsExport(
  supabase: DbClient,
  type: AnalyticsExportType,
  period: AnalyticsPeriod = "30d"
): Promise<string> {
  const since = periodStartIso(period);

  switch (type) {
    case "bookings":
      return exportBookingsCsv(supabase, since);
    case "reviews":
      return exportReviewsCsv(supabase, since);
    case "payments":
      return exportPaymentsCsv(supabase, since);
  }
}
