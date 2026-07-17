import type { SupabaseClient } from "@supabase/supabase-js";
import { periodStartIso } from "@/lib/admin/analytics-period";
import type { Database, Json } from "@/types/database";
import type { AnalyticsPeriod } from "@/types/admin-analytics";
import type {
  PaymentTransactionRow,
  ReconciliationCurrencyTotals,
  ReconciliationDiscrepancy,
  ReconciliationSnapshotRow,
  ReconciliationTotals,
} from "@/types/payment-platform";
import { listPaymentTransactions } from "@/lib/payments/transaction-server";
import { aggregateReconciliationByCurrency } from "@/lib/payments/ledger-aggregation";
import { parseMoneyCurrency } from "@/lib/payments/money";

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
  const byCurrency = Array.isArray(totalsRaw.byCurrency)
    ? totalsRaw.byCurrency.flatMap((value): ReconciliationCurrencyTotals[] => {
        const record = asRecord(value);
        const currency =
          typeof record.currency === "string" ? parseMoneyCurrency(record.currency) : null;
        if (!currency) return [];
        return [
          {
            currency,
            chargeCount: Number(record.chargeCount) || 0,
            chargeAmount: Number(record.chargeAmount) || 0,
            refundCount: Number(record.refundCount) || 0,
            refundAmount: Number(record.refundAmount) || 0,
            payoutCount: Number(record.payoutCount) || 0,
            payoutAmount: Number(record.payoutAmount) || 0,
            netAmount: Number(record.netAmount) || 0,
            pendingRefundCount: Number(record.pendingRefundCount) || 0,
          },
        ];
      })
    : [];
  const isVersion2 = Number(totalsRaw.schemaVersion) === 2;
  const totals: ReconciliationTotals = isVersion2
    ? {
        schemaVersion: 2,
        byCurrency,
        invalidRecordCount: Number(totalsRaw.invalidRecordCount) || 0,
      }
    : {
        schemaVersion: 1,
        byCurrency: [],
        invalidRecordCount: 0,
        legacyUnknownCurrency: true,
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
  const result = aggregateReconciliationByCurrency(transactions);
  return {
    schemaVersion: 2,
    byCurrency: [...result.byCurrency],
    invalidRecordCount: result.issues.length,
  };
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
