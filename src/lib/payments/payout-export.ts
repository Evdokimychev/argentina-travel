import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { periodStartIso } from "@/lib/admin/analytics-period";
import type { Database } from "@/types/database";
import type { AnalyticsPeriod } from "@/types/admin-analytics";
import type { PayoutRecordRow } from "@/types/payment-platform";
import { listCommissionSnapshotsForOrganizer } from "@/lib/payments/commission-server";

type DbClient = SupabaseClient<Database>;

export function csvEscape(value: string | number | null | undefined): string {
  const text = value == null ? "" : String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function hashCsvContent(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

type SnapshotExportRow = {
  booking_id: string;
  gross_amount: number;
  commission_amount: number;
  organizer_net_amount: number;
  commission_percent: number | null;
  commission_fixed: number | null;
  currency: string;
  created_at: string;
  bookings: { tour_title?: string } | null;
};

async function resolveOrganizerDisplayName(
  supabase: DbClient,
  organizerUserId: string
): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("first_name, last_name, email")
    .eq("id", organizerUserId)
    .maybeSingle();

  if (!data) return organizerUserId;

  const name = [data.first_name, data.last_name].filter(Boolean).join(" ").trim();
  return name || data.email || organizerUserId;
}

export async function buildPayoutBatchCsv(
  supabase: DbClient,
  payout: PayoutRecordRow
): Promise<string> {
  const organizerName = await resolveOrganizerDisplayName(supabase, payout.organizerUserId);

  const { data: snapshots } = await supabase
    .from("booking_commission_snapshots")
    .select(
      "booking_id, gross_amount, commission_amount, organizer_net_amount, commission_percent, commission_fixed, currency, created_at, bookings(tour_title)"
    )
    .eq("payout_record_id", payout.id)
    .order("created_at", { ascending: true });

  const rows = (snapshots ?? []) as SnapshotExportRow[];
  const bookingRefs = rows.map((r) => r.booking_id).join("; ");

  const lines: string[] = [];
  lines.push(
    [
      "payout_batch_id",
      "organizer_user_id",
      "organizer_name",
      "period",
      "batch_amount",
      "currency",
      "booking_refs",
      "gross_total",
      "commission_total",
      "net_total",
    ].join(",")
  );

  let grossTotal = 0;
  let commissionTotal = 0;
  let netTotal = 0;

  for (const row of rows) {
    grossTotal += Number(row.gross_amount);
    commissionTotal += Number(row.commission_amount);
    netTotal += Number(row.organizer_net_amount);
  }

  lines.push(
    [
      csvEscape(payout.id),
      csvEscape(payout.organizerUserId),
      csvEscape(organizerName),
      csvEscape(payout.period),
      csvEscape(payout.amount),
      csvEscape(payout.currency),
      csvEscape(bookingRefs),
      csvEscape(Math.round(grossTotal * 100) / 100),
      csvEscape(Math.round(commissionTotal * 100) / 100),
      csvEscape(Math.round(netTotal * 100) / 100),
    ].join(",")
  );

  lines.push("");
  lines.push(
    [
      "booking_id",
      "tour_title",
      "gross_amount",
      "commission_amount",
      "commission_percent",
      "commission_fixed",
      "net_amount",
      "currency",
      "accrual_date",
    ].join(",")
  );

  for (const row of rows) {
    const tourTitle =
      row.bookings && typeof row.bookings.tour_title === "string"
        ? row.bookings.tour_title
        : "";
    lines.push(
      [
        csvEscape(row.booking_id),
        csvEscape(tourTitle),
        csvEscape(row.gross_amount),
        csvEscape(row.commission_amount),
        csvEscape(row.commission_percent),
        csvEscape(row.commission_fixed),
        csvEscape(row.organizer_net_amount),
        csvEscape(row.currency),
        row.created_at,
      ].join(",")
    );
  }

  return lines.join("\n");
}

export function payoutBatchExportFilename(payout: PayoutRecordRow): string {
  return `payout-${payout.period}-${payout.organizerUserId.slice(0, 8)}.csv`;
}

export async function buildOrganizerStatementCsv(
  supabase: DbClient,
  organizerUserId: string,
  period: AnalyticsPeriod,
  payouts: PayoutRecordRow[]
): Promise<string> {
  const since = periodStartIso(period);
  const organizerName = await resolveOrganizerDisplayName(supabase, organizerUserId);
  const snapshots = await listCommissionSnapshotsForOrganizer(supabase, organizerUserId, {
    period,
    limit: 500,
  });

  let grossTotal = 0;
  let commissionTotal = 0;
  let netTotal = 0;

  for (const snap of snapshots) {
    grossTotal += snap.grossAmount;
    commissionTotal += snap.commissionAmount;
    netTotal += snap.organizerNetAmount;
  }

  const lines: string[] = [];
  lines.push("section,key,value");
  lines.push(
    [
      csvEscape("summary"),
      csvEscape("organizer"),
      csvEscape(organizerName),
    ].join(",")
  );
  lines.push([csvEscape("summary"), csvEscape("period"), csvEscape(period)].join(","));
  lines.push(
    [
      csvEscape("summary"),
      csvEscape("generated_at"),
      new Date().toISOString(),
    ].join(",")
  );
  lines.push(
    [
      csvEscape("summary"),
      csvEscape("gross_total"),
      csvEscape(Math.round(grossTotal * 100) / 100),
    ].join(",")
  );
  lines.push(
    [
      csvEscape("summary"),
      csvEscape("commission_total"),
      csvEscape(Math.round(commissionTotal * 100) / 100),
    ].join(",")
  );
  lines.push(
    [
      csvEscape("summary"),
      csvEscape("net_total"),
      csvEscape(Math.round(netTotal * 100) / 100),
    ].join(",")
  );
  lines.push(
    [
      csvEscape("summary"),
      csvEscape("accrual_count"),
      csvEscape(snapshots.length),
    ].join(",")
  );
  lines.push(
    [
      csvEscape("summary"),
      csvEscape("payout_batch_count"),
      csvEscape(payouts.length),
    ].join(",")
  );

  lines.push("");
  lines.push(
    [
      "accrual_date",
      "booking_id",
      "tour_title",
      "gross_amount",
      "commission_amount",
      "commission_percent",
      "net_amount",
      "currency",
      "payout_batch_id",
    ].join(",")
  );

  for (const snap of snapshots) {
    lines.push(
      [
        snap.createdAt,
        csvEscape(snap.bookingId),
        csvEscape(snap.tourTitle ?? ""),
        csvEscape(snap.grossAmount),
        csvEscape(snap.commissionAmount),
        csvEscape(snap.commissionPercent),
        csvEscape(snap.organizerNetAmount),
        csvEscape(snap.currency),
        csvEscape(snap.payoutRecordId ?? ""),
      ].join(",")
    );
  }

  lines.push("");
  lines.push(
    [
      "payout_period",
      "payout_status",
      "payout_amount",
      "currency",
      "created_at",
      "exported_at",
      "completed_at",
    ].join(",")
  );

  for (const payout of payouts) {
    lines.push(
      [
        csvEscape(payout.period),
        csvEscape(payout.status),
        csvEscape(payout.amount),
        csvEscape(payout.currency),
        payout.createdAt,
        csvEscape(payout.exportedAt ?? ""),
        csvEscape(
          typeof payout.metadata.completedAt === "string" ? payout.metadata.completedAt : ""
        ),
      ].join(",")
    );
  }

  if (since) {
    lines.push("");
    lines.push([csvEscape("meta"), csvEscape("period_start"), since].join(","));
  }

  return lines.join("\n");
}

export function organizerStatementFilename(period: AnalyticsPeriod): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `organizer-statement-${period}-${stamp}.csv`;
}
