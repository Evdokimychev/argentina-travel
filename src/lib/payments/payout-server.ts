import type { SupabaseClient } from "@supabase/supabase-js";
import { periodStartIso } from "@/lib/admin/analytics-period";
import type { Database } from "@/types/database";
import type { AnalyticsPeriod } from "@/types/admin-analytics";
import type { OrganizerFinanceSummary } from "@/types/platform-commission";
import type { PayoutRecordRow, PayoutRecordStatus, PayoutSummary } from "@/types/payment-platform";
import { listCommissionSnapshotsForOrganizer } from "@/lib/payments/commission-server";
import { buildPayoutBatchCsv, hashCsvContent } from "@/lib/payments/payout-export";
import {
  aggregateOrganizerBalancesByCurrency,
  aggregatePayoutsByCurrency,
} from "@/lib/payments/ledger-aggregation";
import type { MoneyCurrency } from "@/lib/payments/money";

type DbClient = SupabaseClient<Database>;

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
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
    exportedAt: row.exported_at ?? null,
    exportFileHash: row.export_file_hash ?? null,
    createdBy: row.created_by,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    exportedBy: row.exported_by,
    completedBy: row.completed_by,
    completedAt: row.completed_at,
    cancelledBy: row.cancelled_by,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Statuses that reserve organizer balance until bank transfer is confirmed. */
export function isPayoutInFlight(status: PayoutRecordStatus): boolean {
  return (
    status === "pending" ||
    status === "approved" ||
    status === "exported" ||
    status === "scheduled"
  );
}

export function isPayoutSettled(status: PayoutRecordStatus): boolean {
  return status === "completed" || status === "paid";
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

export function summarizePayoutRecords(rows: PayoutRecordRow[]): PayoutSummary {
  const result = aggregatePayoutsByCurrency(rows);
  return {
    byCurrency: [...result.byCurrency],
    recordCount: rows.length,
    invalidRecordCount: result.issues.length,
  };
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

  const result = aggregateOrganizerBalancesByCurrency({
    snapshots: (snapshots ?? []).map((row) => ({
      grossAmount: Number(row.gross_amount),
      commissionAmount: Number(row.commission_amount),
      organizerNetAmount: Number(row.organizer_net_amount),
      currency: row.currency,
      payoutRecordId: row.payout_record_id,
    })),
    payouts: (payouts ?? []).map((row) => ({
      amount: Number(row.amount),
      currency: row.currency,
      status: row.status,
    })),
  });

  return {
    byCurrency: [...result.byCurrency],
    invalidRecordCount: result.issues.length,
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
  currency: MoneyCurrency;
  adminNotes?: string;
  actorUserId: string;
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

  const { data: claim, error: claimError } = await supabase.rpc(
    "create_payout_batch_atomic",
    {
      p_organizer_user_id: organizerUserId,
      p_currency: input.currency,
      p_period: input.period?.trim() || null,
      p_admin_notes: input.adminNotes?.trim() || null,
      p_actor_user_id: input.actorUserId,
    }
  );
  if (claimError || !claim || typeof claim !== "object" || Array.isArray(claim)) {
    const noBalance = claimError?.message.includes("NO_PAYOUT_BALANCE");
    return {
      ok: false,
      error: noBalance
        ? "Нет доступных средств в выбранной валюте"
        : claimError?.message ?? "Не удалось создать пакет выплаты",
      code: noBalance ? "NO_BALANCE" : "FAILED",
    };
  }
  const payoutId = typeof claim.payoutId === "string" ? claim.payoutId : "";
  const snapshotCount = Number(claim.snapshotCount ?? 0);
  if (!payoutId || !Number.isInteger(snapshotCount) || snapshotCount <= 0) {
    return { ok: false, error: "База вернула некорректный результат", code: "FAILED" };
  }
  const { data: payout, error: payoutError } = await supabase
    .from("payout_records")
    .select("*")
    .eq("id", payoutId)
    .single();
  if (payoutError || !payout) {
    return { ok: false, error: "Пакет создан, но не удалось его загрузить", code: "FAILED" };
  }

  return {
    ok: true,
    payout: mapPayoutRow(payout),
    snapshotCount,
  };
}

export type MarkPayoutCompletedResult =
  | { ok: true; payout: PayoutRecordRow }
  | { ok: false; error: string; code: "NOT_FOUND" | "INVALID_STATE" | "FAILED" };

/**
 * Admin approves payout batch — pending → approved.
 */
export async function approvePayoutBatch(
  supabase: DbClient,
  payoutId: string,
  adminUserId: string,
  adminNotes?: string
): Promise<MarkPayoutCompletedResult> {
  const { data, error } = await supabase.rpc("approve_payout_batch_atomic", {
    p_payout_id: payoutId,
    p_actor_user_id: adminUserId,
    p_admin_notes: adminNotes?.trim() || null,
  });

  if (error || !data) {
    const conflict = error?.message.includes("PAYOUT_APPROVAL_CONFLICT");
    return {
      ok: false,
      error: conflict
        ? "Пакет уже изменён или его пытается одобрить создатель"
        : error?.message ?? "Не удалось одобрить пакет",
      code: conflict ? "INVALID_STATE" : "FAILED",
    };
  }

  return { ok: true, payout: mapPayoutRow(data) };
}

export type ExportPayoutBatchResult =
  | { ok: true; payout: PayoutRecordRow; csv: string; fileHash: string; transitioned: boolean }
  | { ok: false; error: string; code: "NOT_FOUND" | "INVALID_STATE" | "FAILED" };

/**
 * Export payout batch CSV — approved → exported (first export only).
 * Re-export on already exported batches returns CSV without status change.
 */
export async function exportPayoutBatch(
  supabase: DbClient,
  payoutId: string,
  actorUserId: string
): Promise<ExportPayoutBatchResult> {
  const { data: existing, error: fetchError } = await supabase
    .from("payout_records")
    .select("*")
    .eq("id", payoutId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { ok: false, error: "Пакет выплаты не найден", code: "NOT_FOUND" };
  }

  const status = existing.status as PayoutRecordStatus;
  if (status !== "approved") {
    return {
      ok: false,
      error: "Первичный экспорт доступен только для одобренного пакета",
      code: "INVALID_STATE",
    };
  }

  const payoutRow = mapPayoutRow(existing);
  const csv = await buildPayoutBatchCsv(supabase, payoutRow);
  const fileHash = hashCsvContent(csv);

  const { data, error } = await supabase.rpc("mark_payout_exported_atomic", {
    p_payout_id: payoutId,
    p_actor_user_id: actorUserId,
    p_export_file_hash: fileHash,
  });

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Не удалось обновить пакет", code: "FAILED" };
  }

  return {
    ok: true,
    payout: mapPayoutRow(data),
    csv,
    fileHash,
    transitioned: true,
  };
}

/** Download a previously exported immutable batch without mutating its state. */
export async function downloadPayoutBatch(
  supabase: DbClient,
  payoutId: string
): Promise<ExportPayoutBatchResult> {
  const { data: existing, error: fetchError } = await supabase
    .from("payout_records")
    .select("*")
    .eq("id", payoutId)
    .maybeSingle();
  if (fetchError || !existing) {
    return { ok: false, error: "Пакет выплаты не найден", code: "NOT_FOUND" };
  }
  const status = existing.status as PayoutRecordStatus;
  if (status !== "exported" && status !== "completed" && status !== "paid") {
    return { ok: false, error: "Сначала выполните первичный экспорт", code: "INVALID_STATE" };
  }

  const payout = mapPayoutRow(existing);
  const csv = await buildPayoutBatchCsv(supabase, payout);
  const fileHash = hashCsvContent(csv);
  if (!payout.exportFileHash || payout.exportFileHash !== fileHash) {
    return {
      ok: false,
      error: "Содержимое пакета изменилось после экспорта; требуется проверка",
      code: "FAILED",
    };
  }
  return { ok: true, payout, csv, fileHash, transitioned: false };
}

/**
 * Admin marks payout as completed after manual bank transfer — exported → completed.
 */
export async function markPayoutCompleted(
  supabase: DbClient,
  payoutId: string,
  adminUserId: string,
  adminNotes?: string
): Promise<MarkPayoutCompletedResult> {
  const { data, error } = await supabase.rpc("complete_payout_batch_atomic", {
    p_payout_id: payoutId,
    p_actor_user_id: adminUserId,
    p_admin_notes: adminNotes?.trim() || null,
  });

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
  const { data, error } = await supabase.rpc("cancel_payout_batch_atomic", {
    p_payout_id: payoutId,
    p_actor_user_id: adminUserId,
    p_admin_notes: adminNotes?.trim() || null,
  });

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Не удалось отменить пакет", code: "FAILED" };
  }

  return { ok: true, payout: mapPayoutRow(data) };
}

/** @deprecated Use createPayoutBatch — stub kept for compatibility. */
export async function createStubPayoutRecord(
  supabase: DbClient,
  input: {
    organizerUserId: string;
    period?: string;
    amount: number;
    currency: MoneyCurrency;
    actorUserId: string;
  }
): Promise<PayoutRecordRow | null> {
  const result = await createPayoutBatch(supabase, input);
  return result.ok ? result.payout : null;
}
