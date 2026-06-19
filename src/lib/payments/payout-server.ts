import type { SupabaseClient } from "@supabase/supabase-js";
import { periodStartIso } from "@/lib/admin/analytics-period";
import type { Database } from "@/types/database";
import type { AnalyticsPeriod } from "@/types/admin-analytics";
import type { OrganizerFinanceSummary } from "@/types/platform-commission";
import type { PayoutRecordRow, PayoutRecordStatus } from "@/types/payment-platform";
import { listCommissionSnapshotsForOrganizer } from "@/lib/payments/commission-server";

type DbClient = SupabaseClient<Database>;

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function mapPayoutRow(row: Database["public"]["Tables"]["payout_records"]["Row"]): PayoutRecordRow {
  const metadata = asRecord(row.metadata);
  return {
    id: row.id,
    organizerUserId: row.organizer_user_id,
    period: row.period,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status as PayoutRecordStatus,
    metadata: {
      ...metadata,
      approvedBy: row.approved_by ?? metadata.approvedBy,
      completedAt: row.completed_at ?? metadata.completedAt,
      adminNotes: row.admin_notes ?? metadata.adminNotes,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function formatPayoutPeriod(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export async function listPayoutRecords(
  supabase: DbClient,
  filters?: { period?: AnalyticsPeriod; organizerUserId?: string; status?: PayoutRecordStatus | "all" }
): Promise<PayoutRecordRow[]> {
  const since = periodStartIso(filters?.period ?? "90d");

  let query = supabase
    .from("payout_records")
    .select("*")
    .order("period", { ascending: false })
    .limit(500);

  if (since) {
    query = query.gte("created_at", since);
  }

  if (filters?.organizerUserId?.trim()) {
    query = query.eq("organizer_user_id", filters.organizerUserId.trim());
  }

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(mapPayoutRow);
}

export type PayoutSummary = {
  totalPending: number;
  totalScheduled: number;
  totalPaid: number;
  recordCount: number;
};

export function summarizePayoutRecords(rows: PayoutRecordRow[]): PayoutSummary {
  const summary: PayoutSummary = {
    totalPending: 0,
    totalScheduled: 0,
    totalPaid: 0,
    recordCount: rows.length,
  };

  for (const row of rows) {
    if (row.status === "pending") summary.totalPending += row.amount;
    else if (row.status === "scheduled") summary.totalScheduled += row.amount;
    else if (row.status === "paid") summary.totalPaid += row.amount;
  }

  summary.totalPending = roundMoney(summary.totalPending);
  summary.totalScheduled = roundMoney(summary.totalScheduled);
  summary.totalPaid = roundMoney(summary.totalPaid);
  return summary;
}

export async function calculateOrganizerBalance(
  supabase: DbClient,
  organizerUserId: string
): Promise<OrganizerFinanceSummary> {
  const { data: snapshots } = await supabase
    .from("booking_commission_snapshots")
    .select("organizer_net_amount, commission_amount, gross_amount, payout_record_id, currency")
    .eq("organizer_user_id", organizerUserId);

  const { data: payouts } = await supabase
    .from("payout_records")
    .select("amount, status, currency")
    .eq("organizer_user_id", organizerUserId);

  let earnedNet = 0;
  let commissionTotal = 0;
  let grossTotal = 0;
  let unpaidSnapshotCount = 0;
  let currency = "USD";

  for (const row of snapshots ?? []) {
    earnedNet += Number(row.organizer_net_amount);
    commissionTotal += Number(row.commission_amount);
    grossTotal += Number(row.gross_amount);
    if (!row.payout_record_id) unpaidSnapshotCount += 1;
    currency = row.currency ?? currency;
  }

  let paidOut = 0;
  let pendingPayout = 0;

  for (const row of payouts ?? []) {
    const amount = Number(row.amount);
    if (row.status === "paid") paidOut += amount;
    else if (row.status === "pending" || row.status === "scheduled") pendingPayout += amount;
    currency = row.currency ?? currency;
  }

  earnedNet = roundMoney(earnedNet);
  commissionTotal = roundMoney(commissionTotal);
  grossTotal = roundMoney(grossTotal);
  paidOut = roundMoney(paidOut);
  pendingPayout = roundMoney(pendingPayout);

  const availableBalance = roundMoney(Math.max(0, earnedNet - paidOut - pendingPayout));

  return {
    earnedNet,
    commissionTotal,
    grossTotal,
    paidOut,
    pendingPayout,
    availableBalance,
    currency,
    snapshotCount: snapshots?.length ?? 0,
    unpaidSnapshotCount,
  };
}

export async function getOrganizerFinanceSummary(
  supabase: DbClient,
  organizerUserId: string,
  period: AnalyticsPeriod = "90d"
): Promise<{
  summary: OrganizerFinanceSummary;
  snapshots: Awaited<ReturnType<typeof listCommissionSnapshotsForOrganizer>>;
  payouts: PayoutRecordRow[];
}> {
  const summary = await calculateOrganizerBalance(supabase, organizerUserId);
  const snapshots = await listCommissionSnapshotsForOrganizer(supabase, organizerUserId, {
    period,
    limit: 50,
  });
  const payouts = await listPayoutRecords(supabase, { organizerUserId, period });

  return { summary, snapshots, payouts };
}

export type CreatePayoutBatchInput = {
  organizerUserId: string;
  period?: string;
  currency?: string;
  adminNotes?: string;
};

export type CreatePayoutBatchResult =
  | { ok: true; payout: PayoutRecordRow; snapshotCount: number }
  | { ok: false; error: string; code: "NO_BALANCE" | "FAILED" };

/**
 * Create a pending payout batch from unpaid commission snapshots.
 * No bank transfer — admin marks completed manually later.
 */
export async function createPayoutBatch(
  supabase: DbClient,
  input: CreatePayoutBatchInput
): Promise<CreatePayoutBatchResult> {
  const organizerUserId = input.organizerUserId.trim();
  if (!organizerUserId) {
    return { ok: false, error: "Не указан организатор", code: "FAILED" };
  }

  const { data: unpaidSnapshots, error: snapError } = await supabase
    .from("booking_commission_snapshots")
    .select("id, organizer_net_amount, currency")
    .eq("organizer_user_id", organizerUserId)
    .is("payout_record_id", null);

  if (snapError) {
    return { ok: false, error: snapError.message, code: "FAILED" };
  }

  if (!unpaidSnapshots?.length) {
    return { ok: false, error: "Нет доступных средств для выплаты", code: "NO_BALANCE" };
  }

  let amount = 0;
  let currency = input.currency ?? "USD";
  for (const snap of unpaidSnapshots) {
    amount += Number(snap.organizer_net_amount);
    currency = snap.currency ?? currency;
  }
  amount = roundMoney(amount);

  if (amount <= 0) {
    return { ok: false, error: "Сумма выплаты равна нулю", code: "NO_BALANCE" };
  }

  const { data: payout, error: payoutError } = await supabase
    .from("payout_records")
    .insert({
      organizer_user_id: organizerUserId,
      period: input.period ?? formatPayoutPeriod(),
      amount,
      currency,
      status: "pending",
      admin_notes: input.adminNotes?.trim() || null,
      metadata: {
        source: "commission_batch",
        snapshotCount: unpaidSnapshots.length,
        note: "Пакет выплаты — подтверждение вручную администратором",
      },
    })
    .select("*")
    .single();

  if (payoutError || !payout) {
    return { ok: false, error: payoutError?.message ?? "Не удалось создать пакет выплаты", code: "FAILED" };
  }

  const snapshotIds = unpaidSnapshots.map((s) => s.id);
  const { error: linkError } = await supabase
    .from("booking_commission_snapshots")
    .update({ payout_record_id: payout.id })
    .in("id", snapshotIds);

  if (linkError) {
    await supabase.from("payout_records").delete().eq("id", payout.id);
    return { ok: false, error: linkError.message, code: "FAILED" };
  }

  return {
    ok: true,
    payout: mapPayoutRow(payout),
    snapshotCount: snapshotIds.length,
  };
}

export type MarkPayoutCompletedResult =
  | { ok: true; payout: PayoutRecordRow }
  | { ok: false; error: string; code: "NOT_FOUND" | "INVALID_STATE" | "FAILED" };

/**
 * Admin marks payout as completed — records manual settlement, no bank API.
 */
export async function markPayoutCompleted(
  supabase: DbClient,
  payoutId: string,
  adminUserId: string,
  adminNotes?: string
): Promise<MarkPayoutCompletedResult> {
  const { data: existing, error: fetchError } = await supabase
    .from("payout_records")
    .select("*")
    .eq("id", payoutId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { ok: false, error: "Пакет выплаты не найден", code: "NOT_FOUND" };
  }

  if (existing.status === "paid" || existing.status === "cancelled") {
    return { ok: false, error: "Пакет уже завершён или отменён", code: "INVALID_STATE" };
  }

  const completedAt = new Date().toISOString();
  const metadata = asRecord(existing.metadata);

  const { data, error } = await supabase
    .from("payout_records")
    .update({
      status: "paid",
      approved_by: adminUserId,
      completed_at: completedAt,
      admin_notes: adminNotes?.trim() || existing.admin_notes,
      metadata: {
        ...metadata,
        completedAt,
        settlementType: "manual_admin",
      },
      updated_at: completedAt,
    })
    .eq("id", payoutId)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Не удалось обновить пакет", code: "FAILED" };
  }

  return { ok: true, payout: mapPayoutRow(data) };
}

export async function cancelPayoutBatch(
  supabase: DbClient,
  payoutId: string,
  adminUserId: string,
  adminNotes?: string
): Promise<MarkPayoutCompletedResult> {
  const { data: existing } = await supabase
    .from("payout_records")
    .select("*")
    .eq("id", payoutId)
    .maybeSingle();

  if (!existing) {
    return { ok: false, error: "Пакет выплаты не найден", code: "NOT_FOUND" };
  }

  if (existing.status === "paid") {
    return { ok: false, error: "Выплаченный пакет не может быть отменён", code: "INVALID_STATE" };
  }

  await supabase
    .from("booking_commission_snapshots")
    .update({ payout_record_id: null })
    .eq("payout_record_id", payoutId);

  const { data, error } = await supabase
    .from("payout_records")
    .update({
      status: "cancelled",
      approved_by: adminUserId,
      admin_notes: adminNotes?.trim() || existing.admin_notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payoutId)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Не удалось отменить пакет", code: "FAILED" };
  }

  return { ok: true, payout: mapPayoutRow(data) };
}

/** @deprecated Use createPayoutBatch — stub kept for compatibility. */
export async function createStubPayoutRecord(
  supabase: DbClient,
  input: { organizerUserId: string; period?: string; amount: number; currency?: string }
): Promise<PayoutRecordRow | null> {
  const result = await createPayoutBatch(supabase, input);
  return result.ok ? result.payout : null;
}
