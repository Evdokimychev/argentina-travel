import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  BookingCommissionSnapshotRow,
  CommissionReportTotals,
  PlatformCommissionRuleRow,
} from "@/types/platform-commission";
import type { AnalyticsPeriod } from "@/types/admin-analytics";
import { periodStartIso } from "@/lib/admin/analytics-period";

type DbClient = SupabaseClient<Database>;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function mapRuleRow(
  row: Database["public"]["Tables"]["platform_commission_rules"]["Row"]
): PlatformCommissionRuleRow {
  return {
    id: row.id,
    name: row.name,
    ruleType: row.rule_type as PlatformCommissionRuleRow["ruleType"],
    percentValue: row.percent_value != null ? Number(row.percent_value) : null,
    fixedAmount: row.fixed_amount != null ? Number(row.fixed_amount) : null,
    fixedCurrency: row.fixed_currency,
    isDefault: row.is_default,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSnapshotRow(
  row: Database["public"]["Tables"]["booking_commission_snapshots"]["Row"],
  tourTitle?: string
): BookingCommissionSnapshotRow {
  return {
    id: row.id,
    bookingId: row.booking_id,
    paymentTransactionId: row.payment_transaction_id,
    organizerUserId: row.organizer_user_id,
    grossAmount: Number(row.gross_amount),
    commissionAmount: Number(row.commission_amount),
    organizerNetAmount: Number(row.organizer_net_amount),
    commissionRuleId: row.commission_rule_id,
    commissionPercent: row.commission_percent != null ? Number(row.commission_percent) : null,
    commissionFixed: row.commission_fixed != null ? Number(row.commission_fixed) : null,
    currency: row.currency,
    payoutRecordId: row.payout_record_id,
    createdAt: row.created_at,
    tourTitle,
  };
}

export async function getDefaultCommissionRule(supabase: DbClient): Promise<PlatformCommissionRuleRow | null> {
  const { data } = await supabase
    .from("platform_commission_rules")
    .select("*")
    .eq("is_default", true)
    .eq("active", true)
    .maybeSingle();

  if (!data) {
    const { data: fallback } = await supabase
      .from("platform_commission_rules")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    return fallback ? mapRuleRow(fallback) : null;
  }

  return mapRuleRow(data);
}

export function calculateCommissionSplit(
  grossAmount: number,
  rule: PlatformCommissionRuleRow
): {
  commissionAmount: number;
  organizerNetAmount: number;
  commissionPercent: number | null;
  commissionFixed: number | null;
} {
  const gross = Math.max(0, grossAmount);

  if (rule.ruleType === "fixed" && rule.fixedAmount != null) {
    const fixed = Math.min(gross, Math.max(0, rule.fixedAmount));
    const commissionAmount = roundMoney(fixed);
    return {
      commissionAmount,
      organizerNetAmount: roundMoney(Math.max(0, gross - commissionAmount)),
      commissionPercent: null,
      commissionFixed: commissionAmount,
    };
  }

  const percent = rule.percentValue ?? 0;
  const commissionAmount = roundMoney(gross * (percent / 100));
  return {
    commissionAmount,
    organizerNetAmount: roundMoney(Math.max(0, gross - commissionAmount)),
    commissionPercent: percent,
    commissionFixed: null,
  };
}

export type CreateCommissionSnapshotInput = {
  bookingId: string;
  paymentTransactionId: string;
  organizerUserId: string;
  grossAmount: number;
  currency?: string;
};

/** Idempotent snapshot on payment_transaction_id — called after completed charge. */
export async function createCommissionSnapshotForCharge(
  supabase: DbClient,
  input: CreateCommissionSnapshotInput
): Promise<BookingCommissionSnapshotRow | null> {
  const organizerUserId = input.organizerUserId.trim();
  if (!organizerUserId) return null;

  const { data: existing } = await supabase
    .from("booking_commission_snapshots")
    .select("id")
    .eq("payment_transaction_id", input.paymentTransactionId)
    .maybeSingle();

  if (existing?.id) {
    const { data } = await supabase
      .from("booking_commission_snapshots")
      .select("*")
      .eq("id", existing.id)
      .single();
    return data ? mapSnapshotRow(data) : null;
  }

  const rule = await getDefaultCommissionRule(supabase);
  if (!rule) return null;

  const split = calculateCommissionSplit(input.grossAmount, rule);
  const currency = input.currency ?? "USD";

  const { data, error } = await supabase
    .from("booking_commission_snapshots")
    .insert({
      booking_id: input.bookingId,
      payment_transaction_id: input.paymentTransactionId,
      organizer_user_id: organizerUserId,
      gross_amount: Math.max(0, input.grossAmount),
      commission_amount: split.commissionAmount,
      organizer_net_amount: split.organizerNetAmount,
      commission_rule_id: rule.id,
      commission_percent: split.commissionPercent,
      commission_fixed: split.commissionFixed,
      currency,
    })
    .select("*")
    .single();

  if (error || !data) return null;
  return mapSnapshotRow(data);
}

export async function listCommissionSnapshotsForOrganizer(
  supabase: DbClient,
  organizerUserId: string,
  options?: { period?: AnalyticsPeriod; limit?: number; unpaidOnly?: boolean }
): Promise<BookingCommissionSnapshotRow[]> {
  const since = options?.period ? periodStartIso(options.period) : null;
  const limit = options?.limit ?? 200;

  let query = supabase
    .from("booking_commission_snapshots")
    .select("*, bookings(tour_title)")
    .eq("organizer_user_id", organizerUserId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (since) {
    query = query.gte("created_at", since);
  }

  if (options?.unpaidOnly) {
    query = query.is("payout_record_id", null);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => {
    const bookingJoin = row.bookings as { tour_title?: string } | null;
    const { bookings: _bookings, ...snapshotRow } = row;
    return mapSnapshotRow(
      snapshotRow as Database["public"]["Tables"]["booking_commission_snapshots"]["Row"],
      typeof bookingJoin?.tour_title === "string" ? bookingJoin.tour_title : undefined
    );
  });
}

export async function buildCommissionReport(
  supabase: DbClient,
  period: AnalyticsPeriod = "30d"
): Promise<CommissionReportTotals> {
  const since = periodStartIso(period);

  let query = supabase
    .from("booking_commission_snapshots")
    .select("gross_amount, commission_amount, organizer_net_amount, organizer_user_id");

  if (since) {
    query = query.gte("created_at", since);
  }

  const { data, error } = await query;
  if (error || !data) {
    return {
      grossTotal: 0,
      commissionTotal: 0,
      organizerNetTotal: 0,
      snapshotCount: 0,
      organizerCount: 0,
    };
  }

  const organizers = new Set<string>();
  let grossTotal = 0;
  let commissionTotal = 0;
  let organizerNetTotal = 0;

  for (const row of data) {
    grossTotal += Number(row.gross_amount);
    commissionTotal += Number(row.commission_amount);
    organizerNetTotal += Number(row.organizer_net_amount);
    organizers.add(row.organizer_user_id);
  }

  return {
    grossTotal: roundMoney(grossTotal),
    commissionTotal: roundMoney(commissionTotal),
    organizerNetTotal: roundMoney(organizerNetTotal),
    snapshotCount: data.length,
    organizerCount: organizers.size,
  };
}
