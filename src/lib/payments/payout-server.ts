import type { SupabaseClient } from "@supabase/supabase-js";
import { periodStartIso } from "@/lib/admin/analytics-period";
import type { Database } from "@/types/database";
import type { AnalyticsPeriod } from "@/types/admin-analytics";
import type { PayoutRecordRow, PayoutRecordStatus } from "@/types/payment-platform";

type DbClient = SupabaseClient<Database>;

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function mapPayoutRow(row: Database["public"]["Tables"]["payout_records"]["Row"]): PayoutRecordRow {
  return {
    id: row.id,
    organizerUserId: row.organizer_user_id,
    period: row.period,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status as PayoutRecordStatus,
    metadata: asRecord(row.metadata),
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

export type CreateStubPayoutInput = {
  organizerUserId: string;
  period?: string;
  amount: number;
  currency?: string;
};

/** Stub row for future settlement pipeline — no real transfer. */
export async function createStubPayoutRecord(
  supabase: DbClient,
  input: CreateStubPayoutInput
): Promise<PayoutRecordRow | null> {
  const { data, error } = await supabase
    .from("payout_records")
    .insert({
      organizer_user_id: input.organizerUserId,
      period: input.period ?? formatPayoutPeriod(),
      amount: Math.max(0, input.amount),
      currency: input.currency ?? "USD",
      status: "pending",
      metadata: { source: "stub", note: "Заглушка до интеграции выплат" },
    })
    .select("*")
    .single();

  if (error || !data) return null;
  return mapPayoutRow(data);
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

  summary.totalPending = Math.round(summary.totalPending);
  summary.totalScheduled = Math.round(summary.totalScheduled);
  summary.totalPaid = Math.round(summary.totalPaid);
  return summary;
}
