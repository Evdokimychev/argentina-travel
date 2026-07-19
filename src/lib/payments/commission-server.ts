import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  BookingCommissionSnapshotRow,
  CommissionReportTotals,
  PlatformCommissionRuleRow,
} from "@/types/platform-commission";
import type { AnalyticsPeriod } from "@/types/admin-analytics";
import { periodStartIso } from "@/lib/admin/analytics-period";
import { aggregateCommissionByCurrency } from "@/lib/payments/ledger-aggregation";
import { moneyFromMajorUnits, moneyToMajorUnits, parseMoneyCurrency } from "@/lib/payments/money";

type DbClient = SupabaseClient<Database>;

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
    utmSourceMatch: row.utm_source_match,
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
      .is("utm_source_match", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    return fallback ? mapRuleRow(fallback) : null;
  }

  return mapRuleRow(data);
}

export async function getCommissionRuleForBooking(
  supabase: DbClient,
  bookingId: string
): Promise<PlatformCommissionRuleRow | null> {
  const { data: attribution } = await supabase
    .from("booking_attribution")
    .select("utm_source")
    .eq("booking_id", bookingId)
    .maybeSingle();

  const utmSource = attribution?.utm_source?.trim();
  if (utmSource) {
    const { data: matched } = await supabase
      .from("platform_commission_rules")
      .select("*")
      .eq("active", true)
      .ilike("utm_source_match", utmSource)
      .maybeSingle();

    if (matched) return mapRuleRow(matched);
  }

  return getDefaultCommissionRule(supabase);
}

export function calculateCommissionSplit(
  grossAmount: number,
  currencyValue: string,
  rule: PlatformCommissionRuleRow
):
  | {
      ok: true;
      commissionAmount: number;
      organizerNetAmount: number;
      commissionPercent: number | null;
      commissionFixed: number | null;
    }
  | { ok: false; error: "UNSUPPORTED_CURRENCY" | "INVALID_AMOUNT" | "FIXED_CURRENCY_MISMATCH" } {
  const currency = parseMoneyCurrency(currencyValue);
  if (!currency) return { ok: false, error: "UNSUPPORTED_CURRENCY" };

  let grossMoney;
  try {
    grossMoney = moneyFromMajorUnits(currency, grossAmount);
  } catch {
    return { ok: false, error: "INVALID_AMOUNT" };
  }

  if (rule.ruleType === "fixed" && rule.fixedAmount != null) {
    const fixedCurrency = parseMoneyCurrency(rule.fixedCurrency);
    if (!fixedCurrency || fixedCurrency !== currency) {
      return { ok: false, error: "FIXED_CURRENCY_MISMATCH" };
    }
    let fixedMoney;
    try {
      fixedMoney = moneyFromMajorUnits(currency, rule.fixedAmount);
    } catch {
      return { ok: false, error: "INVALID_AMOUNT" };
    }
    const commissionMinorUnits = Math.min(grossMoney.minorUnits, fixedMoney.minorUnits);
    const commissionAmount = moneyToMajorUnits({ currency, minorUnits: commissionMinorUnits });
    return {
      ok: true,
      commissionAmount,
      organizerNetAmount: moneyToMajorUnits({
        currency,
        minorUnits: grossMoney.minorUnits - commissionMinorUnits,
      }),
      commissionPercent: null,
      commissionFixed: commissionAmount,
    };
  }

  const percent = rule.percentValue ?? 0;
  if (!Number.isFinite(percent) || percent < 0) {
    return { ok: false, error: "INVALID_AMOUNT" };
  }
  const commissionMinorUnits = Math.min(
    grossMoney.minorUnits,
    Math.round(grossMoney.minorUnits * (percent / 100)),
  );
  const commissionAmount = moneyToMajorUnits({ currency, minorUnits: commissionMinorUnits });
  return {
    ok: true,
    commissionAmount,
    organizerNetAmount: moneyToMajorUnits({
      currency,
      minorUnits: grossMoney.minorUnits - commissionMinorUnits,
    }),
    commissionPercent: percent,
    commissionFixed: null,
  };
}

export type CreateCommissionSnapshotInput = {
  bookingId: string;
  paymentTransactionId: string;
  organizerUserId: string;
  grossAmount: number;
  currency: string;
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

  const rule = await getCommissionRuleForBooking(supabase, input.bookingId);
  if (!rule) return null;

  const currency = input.currency;
  const split = calculateCommissionSplit(input.grossAmount, currency, rule);
  if (!split.ok) return null;

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

export async function listCommissionSnapshotsForBooking(
  supabase: DbClient,
  bookingId: string
): Promise<BookingCommissionSnapshotRow[]> {
  const { data, error } = await supabase
    .from("booking_commission_snapshots")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => mapSnapshotRow(row));
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
    .select("gross_amount, commission_amount, organizer_net_amount, organizer_user_id, currency");

  if (since) {
    query = query.gte("created_at", since);
  }

  const { data, error } = await query;
  if (error || !data) {
    return {
      byCurrency: [],
      snapshotCount: 0,
      organizerCount: 0,
      invalidRecordCount: 0,
    };
  }

  const result = aggregateCommissionByCurrency(
    data.map((row) => ({
      grossAmount: Number(row.gross_amount),
      commissionAmount: Number(row.commission_amount),
      organizerNetAmount: Number(row.organizer_net_amount),
      organizerId: row.organizer_user_id,
      currency: row.currency,
    })),
  );
  const organizers = new Set(data.map((row) => row.organizer_user_id));

  return {
    byCurrency: [...result.byCurrency],
    snapshotCount: data.length,
    organizerCount: organizers.size,
    invalidRecordCount: result.issues.length,
  };
}
