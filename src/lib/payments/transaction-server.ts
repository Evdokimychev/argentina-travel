import type { SupabaseClient } from "@supabase/supabase-js";
import { periodStartIso } from "@/lib/admin/analytics-period";
import type { Database, Json, PaymentTransactionDbRow } from "@/types/database";
import type { BookingPaymentWebhookPatch } from "@/types/payment-webhook";
import type {
  PaymentTransactionFilters,
  PaymentTransactionReceiptView,
  PaymentTransactionRow,
  PaymentTransactionStatus,
  PaymentTransactionType,
  PaymentReceiptMetadata,
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
  paymentStatus: BookingPaymentWebhookPatch["paymentStatus"],
  capturePhase?: string
): PaymentTransactionStatus {
  if (capturePhase === "authorized") return "processing";
  if (capturePhase === "failed") return "failed";
  if (paymentStatus === "paid" || paymentStatus === "partial") return "completed";
  if (paymentStatus === "refunded") return "completed";
  return "pending";
}

function parseReceiptMetadata(metadata: Record<string, unknown>): PaymentReceiptMetadata | null {
  const receipt = metadata.receipt;
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) return null;
  const record = receipt as Record<string, unknown>;
  const providerPaymentId =
    typeof record.providerPaymentId === "string" ? record.providerPaymentId.trim() : "";
  const providerStatus =
    typeof record.providerStatus === "string" ? record.providerStatus.trim() : "";
  const capturePhase = record.capturePhase;
  if (!providerPaymentId || !providerStatus) return null;
  if (
    capturePhase !== "authorized" &&
    capturePhase !== "captured" &&
    capturePhase !== "refunded" &&
    capturePhase !== "pending" &&
    capturePhase !== "failed"
  ) {
    return null;
  }

  return {
    providerPaymentId,
    providerStatus,
    capturePhase,
    statusDetail:
      typeof record.statusDetail === "string" ? record.statusDetail.trim() : undefined,
    dateCreated: typeof record.dateCreated === "string" ? record.dateCreated : undefined,
    dateApproved: typeof record.dateApproved === "string" ? record.dateApproved : undefined,
    paymentMethodId:
      typeof record.paymentMethodId === "string" ? record.paymentMethodId.trim() : undefined,
    authorizationCode:
      typeof record.authorizationCode === "string"
        ? record.authorizationCode.trim()
        : undefined,
  };
}

export function mapTransactionToReceiptView(row: PaymentTransactionRow): PaymentTransactionReceiptView {
  const receipt = parseReceiptMetadata(row.metadata);
  const occurredAt =
    typeof row.metadata.occurredAt === "string" ? row.metadata.occurredAt : null;

  return {
    transactionId: row.id,
    bookingId: row.bookingId,
    provider: row.provider,
    externalId: row.externalId,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    type: row.type,
    paidAt: receipt?.dateApproved ?? occurredAt ?? (row.status === "completed" ? row.updatedAt : null),
    receipt,
  };
}

export type UpsertChargeFromWebhookInput = {
  bookingId: string;
  provider: BookingPaymentWebhookPatch["provider"];
  externalId: string;
  amount: number;
  currency?: string;
  patch: BookingPaymentWebhookPatch;
  receiptMetadata?: Record<string, unknown>;
};

/** Idempotent insert/update of charge row keyed by provider + external_id. */
export async function upsertChargeFromWebhook(
  supabase: DbClient,
  input: UpsertChargeFromWebhookInput
): Promise<PaymentTransactionRow | null> {
  const externalId = input.externalId.trim();
  if (!externalId) return null;

  const capturePhase =
    typeof input.receiptMetadata?.capturePhase === "string"
      ? input.receiptMetadata.capturePhase
      : undefined;
  const status = resolveChargeStatus(input.patch.paymentStatus, capturePhase);
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
      ...(input.receiptMetadata ? { receipt: input.receiptMetadata } : {}),
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
  metadata?: Record<string, unknown>;
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
      metadata: {
        source: "refund_request",
        requestCreatedAt: new Date().toISOString(),
        ...(input.metadata ?? {}),
      } as Json,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось создать запрос на возврат" };
  }

  return { transaction: mapTransactionRow(data) };
}

export async function findLatestRefundForBooking(
  supabase: DbClient,
  bookingId: string
): Promise<PaymentTransactionRow | null> {
  const { data } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("booking_id", bookingId)
    .eq("type", "refund")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? mapTransactionRow(data) : null;
}

export async function fetchLatestChargeReceiptForBooking(
  supabase: DbClient,
  bookingId: string
): Promise<PaymentTransactionReceiptView | null> {
  const { data } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("booking_id", bookingId)
    .eq("type", "charge")
    .in("status", ["completed", "processing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return mapTransactionToReceiptView(mapTransactionRow(data));
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
      code:
        | "NOT_FOUND"
        | "INVALID_STATE"
        | "MP_NOT_CONFIGURED"
        | "MP_FAILED"
        | "STRIPE_NOT_CONFIGURED"
        | "STRIPE_FAILED"
        | "CHARGE_NOT_FOUND";
    };

export function isMercadoPagoRefundConfigured(): boolean {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  const enabled = process.env.MERCADOPAGO_REFUNDS_ENABLED?.trim().toLowerCase();
  return Boolean(token && enabled === "true");
}

export function isStripeRefundConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

async function resolveChargeExternalId(
  supabase: DbClient,
  bookingId: string,
  provider?: PaymentTransactionRow["provider"]
): Promise<string | null> {
  let query = supabase
    .from("payment_transactions")
    .select("external_id")
    .eq("booking_id", bookingId)
    .eq("type", "charge")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1);

  if (provider) {
    query = query.eq("provider", provider);
  }

  const { data } = await query.maybeSingle();

  return data?.external_id ?? null;
}

function mapStripeRefundStatus(status: string): PaymentTransactionStatus {
  const normalized = status.trim().toLowerCase();
  if (normalized === "succeeded") return "completed";
  if (normalized === "failed" || normalized === "canceled") return "failed";
  if (normalized === "pending" || normalized === "requires_action") return "processing";
  return "processing";
}

function mapMercadoPagoRefundStatus(status: string): PaymentTransactionStatus {
  const normalized = status.trim().toLowerCase();
  if (normalized === "approved") return "completed";
  if (normalized === "cancelled" || normalized === "rejected") return "failed";
  if (normalized === "pending" || normalized === "in_process") return "processing";
  return "processing";
}

type ExecuteRefundAttemptInput = {
  transactionId: string;
  actorUserId?: string;
  adminNotes?: string;
  strictProviderConfig: boolean;
  allowManualCompletion: boolean;
};

export type ExecuteRefundAttemptResult =
  | {
      ok: true;
      transaction: PaymentTransactionRow;
      providerExecuted: boolean;
      skippedReason?: string;
    }
  | {
      ok: false;
      error: string;
      code:
        | "NOT_FOUND"
        | "INVALID_STATE"
        | "MP_NOT_CONFIGURED"
        | "MP_FAILED"
        | "STRIPE_NOT_CONFIGURED"
        | "STRIPE_FAILED"
        | "CHARGE_NOT_FOUND";
    };

async function updateRefundAfterAttempt(
  supabase: DbClient,
  existing: PaymentTransactionRow,
  input: {
    status: PaymentTransactionStatus;
    externalId?: string | null;
    actorUserId?: string;
    adminNotes?: string;
    providerAttempt: Record<string, unknown>;
  }
): Promise<{ transaction: PaymentTransactionRow } | { error: string }> {
  const { data, error } = await supabase
    .from("payment_transactions")
    .update({
      status: input.status,
      approved_by: input.actorUserId ?? existing.approvedBy,
      admin_notes: input.adminNotes?.trim() || existing.adminNotes,
      external_id: input.externalId ?? existing.externalId,
      metadata: {
        ...existing.metadata,
        refundAttempt: input.providerAttempt,
      } as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id)
    .select("*")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось обновить транзакцию" };
  }

  if (input.status === "completed") {
    await supabase
      .from("bookings")
      .update({
        payment_status: "refunded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.bookingId);
  }

  return { transaction: mapTransactionRow(data) };
}

export async function executeRefundAttempt(
  supabase: DbClient,
  input: ExecuteRefundAttemptInput
): Promise<ExecuteRefundAttemptResult> {
  const existing = await fetchPaymentTransactionById(supabase, input.transactionId);
  if (!existing) {
    return { ok: false, error: "Транзакция не найдена", code: "NOT_FOUND" };
  }

  if (existing.type !== "refund" || existing.status !== "pending") {
    return { ok: false, error: "Запрос нельзя одобрить в текущем статусе", code: "INVALID_STATE" };
  }

  if (existing.provider === "manual") {
    if (!input.allowManualCompletion) {
      return {
        ok: true,
        transaction: existing,
        providerExecuted: false,
        skippedReason: "MANUAL_PROVIDER",
      };
    }
    const updated = await updateRefundAfterAttempt(supabase, existing, {
      status: "completed",
      actorUserId: input.actorUserId,
      adminNotes: input.adminNotes,
      providerAttempt: {
        provider: "manual",
        executed: false,
        skippedReason: "MANUAL_PROVIDER",
        attemptedAt: new Date().toISOString(),
      },
    });
    if ("error" in updated) {
      return { ok: false, error: updated.error, code: "MP_FAILED" };
    }
    return { ok: true, transaction: updated.transaction, providerExecuted: false };
  }

  if (existing.provider === "stripe") {
    if (!isStripeRefundConfigured()) {
      if (input.strictProviderConfig) {
        return {
          ok: false,
          error: "Возврат через Stripe недоступен: задайте STRIPE_SECRET_KEY",
          code: "STRIPE_NOT_CONFIGURED",
        };
      }
      return {
        ok: true,
        transaction: existing,
        providerExecuted: false,
        skippedReason: "STRIPE_NOT_CONFIGURED",
      };
    }

    const paymentReference = await resolveChargeExternalId(supabase, existing.bookingId, "stripe");
    if (!paymentReference) {
      return {
        ok: false,
        error: "Не найдено исходное списание для возврата через Stripe",
        code: "CHARGE_NOT_FOUND",
      };
    }

    try {
      const { createStripeRefund } = await import("@/lib/payments/stripe-client");
      const stripeRefund = await createStripeRefund({
        secretKey: process.env.STRIPE_SECRET_KEY!.trim(),
        paymentIntentId: paymentReference.startsWith("pi_") ? paymentReference : undefined,
        chargeId: paymentReference.startsWith("ch_") ? paymentReference : undefined,
        amount: existing.amount,
        reason: "requested_by_customer",
      });
      const status = mapStripeRefundStatus(stripeRefund.status);
      const updated = await updateRefundAfterAttempt(supabase, existing, {
        status,
        externalId: stripeRefund.id,
        actorUserId: input.actorUserId,
        adminNotes: input.adminNotes,
        providerAttempt: {
          provider: "stripe",
          executed: true,
          providerStatus: stripeRefund.status,
          providerRefundId: stripeRefund.id,
          attemptedAt: new Date().toISOString(),
        },
      });
      if ("error" in updated) {
        return { ok: false, error: updated.error, code: "STRIPE_FAILED" };
      }
      return { ok: true, transaction: updated.transaction, providerExecuted: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Не удалось выполнить возврат через Stripe",
        code: "STRIPE_FAILED",
      };
    }
  }

  if (!isMercadoPagoRefundConfigured()) {
    if (input.strictProviderConfig) {
      return {
        ok: false,
        error:
          "Возврат через Mercado Pago недоступен: задайте MERCADOPAGO_ACCESS_TOKEN и MERCADOPAGO_REFUNDS_ENABLED=true",
        code: "MP_NOT_CONFIGURED",
      };
    }
    return {
      ok: true,
      transaction: existing,
      providerExecuted: false,
      skippedReason: "MP_NOT_CONFIGURED",
    };
  }

  const paymentId = await resolveChargeExternalId(supabase, existing.bookingId, "mercadopago");
  if (!paymentId) {
    return {
      ok: false,
      error: "Не найдено исходное списание для возврата через Mercado Pago",
      code: "CHARGE_NOT_FOUND",
    };
  }

  try {
    const { createMercadoPagoRefund } = await import("@/lib/payments/mercadopago-client");
    const refund = await createMercadoPagoRefund({
      paymentId,
      amount: existing.amount,
    });
    const status = mapMercadoPagoRefundStatus(refund.status);
    const updated = await updateRefundAfterAttempt(supabase, existing, {
      status,
      externalId: refund.refundId,
      actorUserId: input.actorUserId,
      adminNotes: input.adminNotes,
      providerAttempt: {
        provider: "mercadopago",
        executed: true,
        providerStatus: refund.status,
        providerRefundId: refund.refundId,
        attemptedAt: new Date().toISOString(),
      },
    });
    if ("error" in updated) {
      return { ok: false, error: updated.error, code: "MP_FAILED" };
    }
    return { ok: true, transaction: updated.transaction, providerExecuted: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Не удалось выполнить возврат через Mercado Pago",
      code: "MP_FAILED",
    };
  }
}

export async function approveRefundRequest(
  supabase: DbClient,
  transactionId: string,
  adminUserId: string,
  adminNotes?: string
): Promise<ApproveRefundResult> {
  return executeRefundAttempt(supabase, {
    transactionId,
    actorUserId: adminUserId,
    adminNotes,
    strictProviderConfig: true,
    allowManualCompletion: true,
  });
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
