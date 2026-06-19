import type { SupabaseClient } from "@supabase/supabase-js";
import { periodStartIso } from "@/lib/admin/analytics-period";
import type { Database, Json } from "@/types/database";
import type { AnalyticsPeriod } from "@/types/admin-analytics";
import type {
  PaymentTransactionRow,
  ReconciliationDiscrepancy,
  ReconciliationSnapshotRow,
  ReconciliationTotals,
} from "@/types/payment-platform";
import { listPaymentTransactions } from "@/lib/payments/transaction-server";

type DbClient = SupabaseClient<Database>;

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asDiscrepancyList(value: unknown): ReconciliationDiscrepancy[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const row = item as Record<string, unknown>;
      return {
        kind: row.kind as ReconciliationDiscrepancy["kind"],
        bookingId: typeof row.bookingId === "string" ? row.bookingId : undefined,
        transactionId: typeof row.transactionId === "string" ? row.transactionId : undefined,
        message: typeof row.message === "string" ? row.message : "",
      };
    })
    .filter((item) => item.message);
}

function mapSnapshotRow(
  row: Database["public"]["Tables"]["payment_audit_log"]["Row"]
): ReconciliationSnapshotRow {
  const totalsRaw = asRecord(row.totals);
  const totals: ReconciliationTotals = {
    chargeCount: Number(totalsRaw.chargeCount) || 0,
    chargeAmount: Number(totalsRaw.chargeAmount) || 0,
    refundCount: Number(totalsRaw.refundCount) || 0,
    refundAmount: Number(totalsRaw.refundAmount) || 0,
    payoutCount: Number(totalsRaw.payoutCount) || 0,
    payoutAmount: Number(totalsRaw.payoutAmount) || 0,
    netAmount: Number(totalsRaw.netAmount) || 0,
    pendingRefundCount: Number(totalsRaw.pendingRefundCount) || 0,
  };

  return {
    id: row.id,
    snapshotDate: row.snapshot_date,
    period: row.period,
    totals,
    discrepancies: asDiscrepancyList(row.discrepancies),
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export function computeReconciliationTotals(
  transactions: PaymentTransactionRow[]
): ReconciliationTotals {
  const totals: ReconciliationTotals = {
    chargeCount: 0,
    chargeAmount: 0,
    refundCount: 0,
    refundAmount: 0,
    payoutCount: 0,
    payoutAmount: 0,
    netAmount: 0,
    pendingRefundCount: 0,
  };

  for (const tx of transactions) {
    if (tx.type === "charge" && tx.status === "completed") {
      totals.chargeCount += 1;
      totals.chargeAmount += tx.amount;
    } else if (tx.type === "refund") {
      if (tx.status === "pending") {
        totals.pendingRefundCount += 1;
      }
      if (tx.status === "completed" || tx.status === "processing") {
        totals.refundCount += 1;
        totals.refundAmount += tx.amount;
      }
    } else if (tx.type === "payout" && (tx.status === "completed" || tx.status === "processing")) {
      totals.payoutCount += 1;
      totals.payoutAmount += tx.amount;
    }
  }

  totals.chargeAmount = Math.round(totals.chargeAmount);
  totals.refundAmount = Math.round(totals.refundAmount);
  totals.payoutAmount = Math.round(totals.payoutAmount);
  totals.netAmount = Math.round(totals.chargeAmount - totals.refundAmount - totals.payoutAmount);
  return totals;
}

export function detectReconciliationDiscrepancies(
  transactions: PaymentTransactionRow[]
): ReconciliationDiscrepancy[] {
  const discrepancies: ReconciliationDiscrepancy[] = [];

  for (const tx of transactions) {
    if (tx.type === "refund" && tx.status === "pending") {
      discrepancies.push({
        kind: "pending_refund",
        bookingId: tx.bookingId,
        transactionId: tx.id,
        message: `Ожидает одобрения возврат на ${tx.amount} ${tx.currency}`,
      });
    }

    if (tx.type === "charge" && tx.status === "completed" && !tx.externalId && tx.provider !== "manual") {
      discrepancies.push({
        kind: "unmatched_charge",
        bookingId: tx.bookingId,
        transactionId: tx.id,
        message: "Списание без внешнего идентификатора провайдера",
      });
    }
  }

  return discrepancies;
}

export async function buildReconciliationSummary(
  supabase: DbClient,
  period: AnalyticsPeriod = "30d"
): Promise<{
  period: AnalyticsPeriod;
  totals: ReconciliationTotals;
  discrepancies: ReconciliationDiscrepancy[];
  transactions: PaymentTransactionRow[];
}> {
  const transactions = await listPaymentTransactions(supabase, { period });
  const totals = computeReconciliationTotals(transactions);
  const discrepancies = detectReconciliationDiscrepancies(transactions);

  return { period, totals, discrepancies, transactions };
}

export async function createReconciliationSnapshot(
  supabase: DbClient,
  input: {
    period: AnalyticsPeriod;
    createdBy: string;
    notes?: string;
  }
): Promise<ReconciliationSnapshotRow | null> {
  const summary = await buildReconciliationSummary(supabase, input.period);

  const { data, error } = await supabase
    .from("payment_audit_log")
    .insert({
      snapshot_date: new Date().toISOString().slice(0, 10),
      period: input.period,
      totals: summary.totals as unknown as Json,
      discrepancies: summary.discrepancies as unknown as Json,
      notes: input.notes?.trim() || null,
      created_by: input.createdBy,
    })
    .select("*")
    .single();

  if (error || !data) return null;
  return mapSnapshotRow(data);
}

export async function listReconciliationSnapshots(
  supabase: DbClient,
  period?: AnalyticsPeriod
): Promise<ReconciliationSnapshotRow[]> {
  const since = period ? periodStartIso(period) : null;

  let query = supabase
    .from("payment_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (since) {
    query = query.gte("created_at", since);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(mapSnapshotRow);
}
