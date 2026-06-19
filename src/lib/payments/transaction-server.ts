import type { SupabaseClient } from "@supabase/supabase-js";
import { periodStartIso } from "@/lib/admin/analytics-period";
import type { Database, Json, PaymentTransactionDbRow } from "@/types/database";
import type { BookingPaymentWebhookPatch } from "@/types/payment-webhook";
import type {
  PaymentTransactionFilters,
  PaymentTransactionRow,
  PaymentTransactionStatus,
  PaymentTransactionType,
} from "@/types/payment-platform";

type DbClient = SupabaseClient<Database>;

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function mapTransactionRow(
  row: PaymentTransactionDbRow,
  booking?: { tour_title?: string; contact_email?: string }
): PaymentTransactionRow {
  return {
    id: row.id,
    bookingId: row.booking_id,
    provider: row.provider as PaymentTransactionRow["provider"],
    externalId: row.external_id,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status as PaymentTransactionStatus,
    type: row.type as PaymentTransactionType,
    sourceEventId: row.source_event_id,
    requestedBy: row.requested_by,
    approvedBy: row.approved_by,
    requestReason: row.request_reason,
    adminNotes: row.admin_notes,
    metadata: asRecord(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tourTitle: booking?.tour_title,
    contactEmail: booking?.contact_email,
  };
}

function resolveChargeStatus(
  paymentStatus: BookingPaymentWebhookPatch["paymentStatus"]
): PaymentTransactionStatus {
  if (paymentStatus === "paid" || paymentStatus === "partial") return "completed";
  if (paymentStatus === "refunded") return "completed";
  return "pending";
}

export type UpsertChargeFromWebhookInput = {
  bookingId: string;
  provider: BookingPaymentWebhookPatch["provider"];
  externalId: string;
  amount: number;
  currency?: string;
  patch: BookingPaymentWebhookPatch;
};

/** Idempotent insert/update of charge row keyed by provider + external_id. */
export async function upsertChargeFromWebhook(
  supabase: DbClient,
  input: UpsertChargeFromWebhookInput
): Promise<PaymentTransactionRow | null> {
  const externalId = input.externalId.trim();
  if (!externalId) return null;

  const status = resolveChargeStatus(input.patch.paymentStatus);
  const payload: Database["public"]["Tables"]["payment_transactions"]["Insert"] = {
    booking_id: input.bookingId,
    provider: input.provider,
    external_id: externalId,
    amount: Math.max(0, input.amount),
    currency: input.currency ?? "USD",
    status,
    type: "charge",
    source_event_id: input.patch.sourceEventId,
    metadata: {
      paymentStatus: input.patch.paymentStatus,
      occurredAt: input.patch.occurredAt,
      paymentSummary: input.patch.paymentSummary,
    } as unknown as Json,
  };

  const { data: existing } = await supabase
    .from("payment_transactions")
    .select("id")
    .eq("provider", input.provider)
    .eq("external_id", externalId)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await supabase
      .from("payment_transactions")
      .update({
        status,
        amount: payload.amount,
        source_event_id: input.patch.sourceEventId,
        metadata: payload.metadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error || !data) return null;
    return mapTransactionRow(data);
  }

  const { data, error } = await supabase
    .from("payment_transactions")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) return null;
  return mapTransactionRow(data);
}

export type CreateRefundRequestInput = {
  bookingId: string;
  amount: number;
  currency?: string;
  provider?: BookingPaymentWebhookPatch["provider"];
  requestedBy: string;
  reason?: string;
};

export async function findPendingRefundForBooking(
  supabase: DbClient,
  bookingId: string
): Promise<PaymentTransactionRow | null> {
  const { data } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("booking_id", bookingId)
    .eq("type", "refund")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? mapTransactionRow(data) : null;
}

export async function createRefundRequest(
  supabase: DbClient,
  input: CreateRefundRequestInput
): Promise<{ transaction: PaymentTransactionRow } | { error: string }> {
  const pending = await findPendingRefundForBooking(supabase, input.bookingId);
  if (pending) {
    return { error: "Запрос на возврат уже ожидает рассмотрения" };
  }

  const { data, error } = await supabase
    .from("payment_transactions")
    .insert({
      booking_id: input.bookingId,
      provider: input.provider ?? "manual",
      amount: Math.max(0, input.amount),
      currency: input.currency ?? "USD",
      status: "pending",
      type: "refund",
      requested_by: input.requestedBy,
      request_reason: input.reason?.trim() || null,
      metadata: { source: "refund_request" } as Json,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось создать запрос на возврат" };
  }

  return { transaction: mapTransactionRow(data) };
}

export async function fetchPaymentTransactionById(
  supabase: DbClient,
  id: string
): Promise<PaymentTransactionRow | null> {
  const { data } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return data ? mapTransactionRow(data) : null;
}

export async function listPaymentTransactions(
  supabase: DbClient,
  filters?: PaymentTransactionFilters
): Promise<PaymentTransactionRow[]> {
  const period = filters?.period ?? "30d";
  const since = periodStartIso(period);

  let query = supabase
    .from("payment_transactions")
    .select("*, bookings(tour_title, contact_email)")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (since) {
    query = query.gte("created_at", since);
  }

  if (filters?.type && filters.type !== "all") {
    query = query.eq("type", filters.type);
  }

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.provider && filters.provider !== "all") {
    query = query.eq("provider", filters.provider);
  }

  if (filters?.bookingId?.trim()) {
    query = query.eq("booking_id", filters.bookingId.trim());
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => {
    const bookingJoin = asRecord(row.bookings);
    const { bookings: _bookings, ...txRow } = row as PaymentTransactionDbRow & {
      bookings?: { tour_title?: string; contact_email?: string };
    };
    return mapTransactionRow(txRow, {
      tour_title: typeof bookingJoin.tour_title === "string" ? bookingJoin.tour_title : undefined,
      contact_email:
        typeof bookingJoin.contact_email === "string" ? bookingJoin.contact_email : undefined,
    });
  });
}

export type ApproveRefundResult =
  | { ok: true; transaction: PaymentTransactionRow; providerExecuted: boolean }
  | {
      ok: false;
      error: string;
      code: "NOT_FOUND" | "INVALID_STATE" | "MP_NOT_CONFIGURED" | "MP_FAILED";
    };

export function isMercadoPagoRefundConfigured(): boolean {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  const enabled = process.env.MERCADOPAGO_REFUNDS_ENABLED?.trim().toLowerCase();
  return Boolean(token && enabled === "true");
}

async function resolveChargeExternalId(
  supabase: DbClient,
  bookingId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("payment_transactions")
    .select("external_id")
    .eq("booking_id", bookingId)
    .eq("type", "charge")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.external_id ?? null;
}

export async function approveRefundRequest(
  supabase: DbClient,
  transactionId: string,
  adminUserId: string,
  adminNotes?: string
): Promise<ApproveRefundResult> {
  const existing = await fetchPaymentTransactionById(supabase, transactionId);
  if (!existing) {
    return { ok: false, error: "Транзакция не найдена", code: "NOT_FOUND" };
  }

  if (existing.type !== "refund" || existing.status !== "pending") {
    return { ok: false, error: "Запрос нельзя одобрить в текущем статусе", code: "INVALID_STATE" };
  }

  if (existing.provider === "mercadopago" && !isMercadoPagoRefundConfigured()) {
    return {
      ok: false,
      error:
        "Возврат через Mercado Pago недоступен: задайте MERCADOPAGO_ACCESS_TOKEN и MERCADOPAGO_REFUNDS_ENABLED=true",
      code: "MP_NOT_CONFIGURED",
    };
  }

  let providerExecuted = false;
  let externalId = existing.externalId;
  let status: PaymentTransactionStatus = "completed";

  if (existing.provider === "mercadopago" && isMercadoPagoRefundConfigured()) {
    const paymentId = await resolveChargeExternalId(supabase, existing.bookingId);
    if (!paymentId) {
      return {
        ok: false,
        error: "Не найдено исходное списание для возврата через Mercado Pago",
        code: "MP_FAILED",
      };
    }

    try {
      const { createMercadoPagoRefund } = await import("@/lib/payments/mercadopago-client");
      const refund = await createMercadoPagoRefund({
        paymentId,
        amount: existing.amount,
      });
      externalId = refund.refundId;
      providerExecuted = true;
      status = refund.status === "approved" ? "completed" : "processing";
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Не удалось выполнить возврат через Mercado Pago",
        code: "MP_FAILED",
      };
    }
  }

  const { data, error } = await supabase
    .from("payment_transactions")
    .update({
      status,
      approved_by: adminUserId,
      admin_notes: adminNotes?.trim() || existing.adminNotes,
      external_id: externalId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", transactionId)
    .select("*")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Не удалось обновить транзакцию",
      code: "MP_FAILED",
    };
  }

  if (status === "completed") {
    await supabase
      .from("bookings")
      .update({
        payment_status: "refunded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.bookingId);
  }

  return { ok: true, transaction: mapTransactionRow(data), providerExecuted };
}

export async function rejectRefundRequest(
  supabase: DbClient,
  transactionId: string,
  adminUserId: string,
  adminNotes?: string
): Promise<{ transaction: PaymentTransactionRow } | { error: string }> {
  const existing = await fetchPaymentTransactionById(supabase, transactionId);
  if (!existing || existing.type !== "refund" || existing.status !== "pending") {
    return { error: "Запрос нельзя отклонить в текущем статусе" };
  }

  const { data, error } = await supabase
    .from("payment_transactions")
    .update({
      status: "rejected",
      approved_by: adminUserId,
      admin_notes: adminNotes?.trim() || existing.adminNotes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", transactionId)
    .select("*")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось отклонить запрос" };
  }

  return { transaction: mapTransactionRow(data) };
}
