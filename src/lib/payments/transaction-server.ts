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
import {
  addMoney,
  capRefundAmount,
  moneyFromMajorUnits,
  parseMoneyCurrency,
  zeroMoney,
  type Money,
} from "@/lib/payments/money";
import { createStablePaymentIdempotencyKey } from "@/lib/payments/payment-idempotency";

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
    requestIdempotencyKey: row.request_idempotency_key,
    sourceTransactionId: row.source_transaction_id,
    claimedBy: row.claimed_by,
    claimedAt: row.claimed_at,
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

export type UpsertChargeFromWebhookResult =
  | { ok: true; transaction: PaymentTransactionRow; operation: "inserted" | "updated" | "unchanged" }
  | {
      ok: false;
      reason:
        | "invalid_external_id"
        | "insert_failed"
        | "existing_lookup_failed"
        | "booking_mismatch"
        | "update_failed";
      error?: string;
    };

function paymentStatusRank(value: unknown): number {
  if (value === "refunded") return 4;
  if (value === "paid") return 3;
  if (value === "partial") return 2;
  if (value === "pending") return 1;
  return 0;
}

function shouldAdvanceWebhookCharge(
  existing: PaymentTransactionDbRow,
  patch: BookingPaymentWebhookPatch,
): boolean {
  const metadata = asRecord(existing.metadata);
  const existingPaymentStatus = metadata.paymentStatus;
  if (existingPaymentStatus === "refunded" && patch.paymentStatus !== "refunded") return false;
  if (patch.paymentStatus === "refunded") return true;

  const existingOccurredAt =
    typeof metadata.occurredAt === "string" ? Date.parse(metadata.occurredAt) : Number.NaN;
  const incomingOccurredAt = Date.parse(patch.occurredAt);
  if (
    Number.isFinite(existingOccurredAt) &&
    Number.isFinite(incomingOccurredAt) &&
    incomingOccurredAt < existingOccurredAt
  ) {
    return false;
  }

  return paymentStatusRank(patch.paymentStatus) >= paymentStatusRank(existingPaymentStatus);
}

/**
 * Idempotent charge insert/update keyed by provider + external_id.
 * The insert-first path lets the existing partial unique index arbitrate concurrent deliveries.
 */
export async function upsertChargeFromWebhook(
  supabase: DbClient,
  input: UpsertChargeFromWebhookInput
): Promise<UpsertChargeFromWebhookResult> {
  const externalId = input.externalId.trim();
  if (!externalId) return { ok: false, reason: "invalid_external_id" };

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

  const { data: inserted, error: insertError } = await supabase
    .from("payment_transactions")
    .insert(payload)
    .select("*")
    .single();

  if (inserted && !insertError) {
    return { ok: true, transaction: mapTransactionRow(inserted), operation: "inserted" };
  }
  if (insertError?.code !== "23505") {
    return { ok: false, reason: "insert_failed", error: insertError?.message };
  }

  const { data: existing, error: lookupError } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("provider", input.provider)
    .eq("external_id", externalId)
    .maybeSingle();

  if (lookupError || !existing) {
    return {
      ok: false,
      reason: "existing_lookup_failed",
      error: lookupError?.message,
    };
  }
  if (existing.booking_id !== input.bookingId) {
    return { ok: false, reason: "booking_mismatch" };
  }
  if (!shouldAdvanceWebhookCharge(existing, input.patch)) {
    return { ok: true, transaction: mapTransactionRow(existing), operation: "unchanged" };
  }

  const { data: updated, error: updateError } = await supabase
    .from("payment_transactions")
    .update({
      status,
      amount: payload.amount,
      currency: payload.currency,
      source_event_id: input.patch.sourceEventId,
      metadata: payload.metadata,
    })
    .eq("id", existing.id)
    .eq("booking_id", input.bookingId)
    .select("*")
    .single();

  if (updateError || !updated) {
    return { ok: false, reason: "update_failed", error: updateError?.message };
  }
  return { ok: true, transaction: mapTransactionRow(updated), operation: "updated" };
}

export type CreateRefundRequestInput = {
  bookingId: string;
  /** Omit for a full refund: the completed source charge is authoritative. */
  amount?: number;
  currency?: string;
  provider?: BookingPaymentWebhookPatch["provider"];
  requestedBy: string;
  operationId: string;
  sourceTransactionId?: string;
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
  const requestedProvider = input.provider;
  const requestedSourceTransactionId = input.sourceTransactionId?.trim();

  const { data: existing, error: existingError } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("type", "refund")
    .eq("request_idempotency_key", input.operationId)
    .maybeSingle();

  if (existingError) {
    return { error: "Не удалось проверить повтор операции возврата" };
  }
  if (existing) {
    const transaction = mapTransactionRow(existing);
    const amountMatches = input.amount === undefined || transaction.amount === input.amount;
    const currencyMatches =
      input.currency === undefined || transaction.currency === input.currency.trim().toUpperCase();
    if (
      transaction.bookingId !== input.bookingId ||
      transaction.requestedBy !== input.requestedBy ||
      (requestedProvider !== undefined && transaction.provider !== requestedProvider) ||
      (requestedSourceTransactionId !== undefined &&
        transaction.sourceTransactionId !== requestedSourceTransactionId) ||
      !amountMatches ||
      !currencyMatches
    ) {
      return { error: "Идентификатор операции уже использован для другого возврата" };
    }
    return { transaction };
  }

  let sourceCharge: PaymentTransactionDbRow | null = null;
  if (requestedSourceTransactionId) {
    const { data, error } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("id", requestedSourceTransactionId)
      .eq("booking_id", input.bookingId)
      .eq("type", "charge")
      .eq("status", "completed")
      .maybeSingle();

    if (error || !data) {
      return { error: "Не найдено исходное завершённое списание для возврата" };
    }
    sourceCharge = data;
  } else {
    let chargeQuery = supabase
      .from("payment_transactions")
      .select("*")
      .eq("booking_id", input.bookingId)
      .eq("type", "charge")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(2);
    if (requestedProvider) {
      chargeQuery = chargeQuery.eq("provider", requestedProvider);
    }
    const { data: charges, error: chargeError } = await chargeQuery;

    if (chargeError || !charges?.length) {
      return { error: "Не найдено исходное завершённое списание для возврата" };
    }
    if (charges.length !== 1) {
      return { error: "Найдено несколько списаний: выберите исходную операцию" };
    }
    sourceCharge = charges[0];
  }

  const sourceProvider = sourceCharge.provider as BookingPaymentWebhookPatch["provider"];
  if (
    !["manual", "stripe", "mercadopago"].includes(sourceProvider) ||
    (requestedProvider !== undefined && sourceProvider !== requestedProvider)
  ) {
    return { error: "Провайдер возврата не совпадает с исходным списанием" };
  }

  const sourceCurrency = sourceCharge.currency.trim().toUpperCase();
  const requestedCurrency = input.currency?.trim().toUpperCase() ?? sourceCurrency;
  const parsedSourceCurrency = parseMoneyCurrency(sourceCurrency);
  if (requestedCurrency !== sourceCurrency || !parsedSourceCurrency) {
    return { error: "Валюта возврата не совпадает с валютой исходного списания" };
  }

  const amount = input.amount ?? Number(sourceCharge.amount);
  try {
    if (!Number.isFinite(amount) || moneyFromMajorUnits(parsedSourceCurrency, amount).minorUnits <= 0) {
      return { error: "Сумма возврата должна быть больше нуля" };
    }
  } catch {
    return { error: "Сумма возврата имеет недопустимую точность" };
  }

  const { data, error } = await supabase.rpc("prepare_refund_request_atomic", {
    p_booking_id: input.bookingId,
    p_source_transaction_id: sourceCharge.id,
    p_amount: amount,
    p_currency: sourceCurrency,
    p_provider: sourceProvider,
    p_requested_by: input.requestedBy,
    p_request_reason: input.reason?.trim() || null,
    p_request_idempotency_key: input.operationId,
    p_metadata: {
      source: "refund_request",
      ...(input.metadata ?? {}),
    } as Json,
  });

  if (error || !data) {
    const message = error?.message ?? "Не удалось создать запрос на возврат";
    if (message.includes("REFUND_EXCEEDS_REMAINING_CHARGE")) {
      return { error: "Сумма возврата превышает доступный остаток по списанию" };
    }
    if (message.includes("payment_refund_active_source_idx")) {
      return { error: "По этому списанию уже есть активный запрос на возврат" };
    }
    if (message.includes("IDEMPOTENCY_KEY_REUSED")) {
      return { error: "Идентификатор операции уже использован для другого возврата" };
    }
    if (message.includes("SOURCE_CHARGE_NOT_FOUND")) {
      return { error: "Не найдено исходное завершённое списание для возврата" };
    }
    if (message.includes("SOURCE_CHARGE_MISMATCH")) {
      return { error: "Параметры возврата не совпадают с исходным списанием" };
    }
    if (message.includes("INVALID_REFUND_AMOUNT")) {
      return { error: "Сумма возврата некорректна" };
    }
    return { error: "Не удалось создать запрос на возврат" };
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
    const txRow = { ...(row as PaymentTransactionDbRow & {
      bookings?: { tour_title?: string; contact_email?: string };
    }) };
    delete txRow.bookings;
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
        | "CHARGE_NOT_FOUND"
        | "INVALID_REFUND_AMOUNT";
    };

export function isMercadoPagoRefundConfigured(): boolean {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  const enabled = process.env.MERCADOPAGO_REFUNDS_ENABLED?.trim().toLowerCase();
  return Boolean(token && enabled === "true");
}

export function isStripeRefundConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export type RefundExecutionPlan = {
  charge: PaymentTransactionRow;
  captured: Money;
  requested: Money;
  remainingBeforeRefund: Money;
  remainingAfterRefund: Money;
};

export async function resolveRefundExecutionPlan(
  supabase: DbClient,
  refund: PaymentTransactionRow,
): Promise<{ ok: true; plan: RefundExecutionPlan } | { ok: false; error: string }> {
  let chargeQuery = supabase
    .from("payment_transactions")
    .select("*")
    .eq("type", "charge")
    .eq("status", "completed");

  chargeQuery = refund.sourceTransactionId
    ? chargeQuery.eq("id", refund.sourceTransactionId)
    : chargeQuery
        .eq("booking_id", refund.bookingId)
        .eq("provider", refund.provider)
        .order("created_at", { ascending: false })
        .limit(2);
  const { data: charges } = await chargeQuery;

  if (!charges?.length) {
    return { ok: false, error: "Не найдено исходное завершённое списание для возврата" };
  }
  if (charges.length > 1) {
    return {
      ok: false,
      error: "Найдено несколько списаний: выберите исходное списание перед возвратом",
    };
  }

  const charge = mapTransactionRow(charges[0]);
  if (!charge.externalId && charge.provider !== "manual") {
    return { ok: false, error: "У исходного списания отсутствует идентификатор провайдера" };
  }

  const chargeCurrency = parseMoneyCurrency(charge.currency);
  const refundCurrency = parseMoneyCurrency(refund.currency);
  if (!chargeCurrency || !refundCurrency || chargeCurrency !== refundCurrency) {
    return { ok: false, error: "Валюта возврата не совпадает с валютой исходного списания" };
  }

  let captured: Money;
  let requested: Money;
  try {
    captured = moneyFromMajorUnits(chargeCurrency, charge.amount);
    requested = moneyFromMajorUnits(refundCurrency, refund.amount);
  } catch {
    return { ok: false, error: "Сумма списания или возврата имеет недопустимую точность" };
  }

  const { data: committedRows } = await supabase
    .from("payment_transactions")
    .select("amount, currency")
    .eq("type", "refund")
    .eq("source_transaction_id", charge.id)
    .in("status", ["processing", "completed"]);

  let committed = zeroMoney(chargeCurrency);
  for (const row of committedRows ?? []) {
    const currency = parseMoneyCurrency(row.currency);
    if (!currency || currency !== chargeCurrency) {
      return { ok: false, error: "В истории возвратов найдена несовместимая валюта" };
    }
    try {
      committed = addMoney(committed, moneyFromMajorUnits(currency, Number(row.amount)));
    } catch {
      return { ok: false, error: "В истории возвратов найдена некорректная сумма" };
    }
  }

  const cap = capRefundAmount({ captured, committedRefunds: committed, requested });
  if (!cap.ok) {
    return { ok: false, error: `Возврат заблокирован: ${cap.reason}` };
  }
  if (cap.wasCapped) {
    return {
      ok: false,
      error: "Запрошенная сумма превышает остаток по исходному списанию",
    };
  }

  return {
    ok: true,
    plan: {
      charge,
      captured,
      requested,
      remainingBeforeRefund: cap.remainingBeforeRefund,
      remainingAfterRefund: cap.remainingAfterRefund,
    },
  };
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
        | "CHARGE_NOT_FOUND"
        | "INVALID_REFUND_AMOUNT";
    };

async function updateRefundAfterAttempt(
  supabase: DbClient,
  existing: PaymentTransactionRow,
  input: {
    status: PaymentTransactionStatus;
    externalId?: string | null;
    providerAttempt: Record<string, unknown>;
    refundPlan: RefundExecutionPlan;
    bookingFullyRefunded: boolean;
  }
): Promise<{ transaction: PaymentTransactionRow } | { error: string }> {
  const { data, error } = await supabase.rpc("finalize_refund_attempt", {
    p_refund_id: existing.id,
    p_status: input.status,
    p_external_id: input.externalId ?? null,
    p_metadata: {
      ...existing.metadata,
      sourceChargeTransactionId: input.refundPlan.charge.id,
      sourceChargeExternalId: input.refundPlan.charge.externalId,
      sourceChargeMinorUnits: input.refundPlan.captured.minorUnits,
      sourceChargeCurrency: input.refundPlan.charge.currency,
      remainingBeforeRefundMinorUnits: input.refundPlan.remainingBeforeRefund.minorUnits,
      remainingAfterRefundMinorUnits: input.refundPlan.remainingAfterRefund.minorUnits,
      refundAttempt: input.providerAttempt,
    } as Json,
    p_booking_fully_refunded: input.bookingFullyRefunded,
  });

  if (error || !data) {
    return { error: error?.message ?? "Не удалось обновить транзакцию" };
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

  const planResult = await resolveRefundExecutionPlan(supabase, existing);
  if (!planResult.ok) {
    return {
      ok: false,
      error: planResult.error,
      code: "INVALID_REFUND_AMOUNT",
    };
  }
  const refundPlan = planResult.plan;
  const refundMoney = refundPlan.requested;
  if (refundMoney.minorUnits === 0) {
    return {
      ok: false,
      error: "Сумма возврата должна быть больше нуля",
      code: "INVALID_REFUND_AMOUNT",
    };
  }

  const refundIdempotencyKey = createStablePaymentIdempotencyKey({
    providerId: existing.provider,
    operation: "refund",
    resourceId: existing.bookingId,
    operationId: existing.id,
    amount: refundMoney,
  });

  if (existing.provider === "manual") {
    if (!input.allowManualCompletion) {
      return {
        ok: true,
        transaction: existing,
        providerExecuted: false,
        skippedReason: "MANUAL_PROVIDER",
      };
    }
  } else if (existing.provider === "stripe" && !isStripeRefundConfigured()) {
    return input.strictProviderConfig
      ? {
          ok: false,
          error: "Возврат через Stripe недоступен: задайте STRIPE_SECRET_KEY",
          code: "STRIPE_NOT_CONFIGURED",
        }
      : {
          ok: true,
          transaction: existing,
          providerExecuted: false,
          skippedReason: "STRIPE_NOT_CONFIGURED",
        };
  } else if (existing.provider === "mercadopago" && !isMercadoPagoRefundConfigured()) {
    return input.strictProviderConfig
      ? {
          ok: false,
          error:
            "Возврат через Mercado Pago недоступен: задайте MERCADOPAGO_ACCESS_TOKEN и MERCADOPAGO_REFUNDS_ENABLED=true",
          code: "MP_NOT_CONFIGURED",
        }
      : {
          ok: true,
          transaction: existing,
          providerExecuted: false,
          skippedReason: "MP_NOT_CONFIGURED",
        };
  }

  if (!input.actorUserId) {
    return { ok: false, error: "Не указан утверждающий сотрудник", code: "INVALID_STATE" };
  }

  const { data: claimedRow, error: claimError } = await supabase.rpc(
    "claim_refund_for_execution",
    {
      p_refund_id: existing.id,
      p_actor_user_id: input.actorUserId,
      p_admin_notes: input.adminNotes?.trim() || null,
    }
  );
  if (claimError || !claimedRow) {
    const sameActor = claimError?.message.includes("REFUND_MAKER_CANNOT_APPROVE");
    return {
      ok: false,
      error: sameActor
        ? "Возврат должен утвердить другой сотрудник"
        : "Запрос уже обрабатывается или был изменён другим сотрудником",
      code: "INVALID_STATE",
    };
  }
  const claimed = mapTransactionRow(claimedRow);

  if (claimed.provider === "manual") {
    const updated = await updateRefundAfterAttempt(supabase, claimed, {
      status: "completed",
      providerAttempt: {
        provider: "manual",
        executed: false,
        skippedReason: "MANUAL_PROVIDER",
        attemptedAt: new Date().toISOString(),
      },
      refundPlan,
      bookingFullyRefunded: refundPlan.remainingAfterRefund.minorUnits === 0,
    });
    if ("error" in updated) {
      return { ok: false, error: updated.error, code: "MP_FAILED" };
    }
    return { ok: true, transaction: updated.transaction, providerExecuted: false };
  }

  if (claimed.provider === "stripe") {
    const paymentReference = refundPlan.charge.externalId!;

    try {
      const { createStripeRefund } = await import("@/lib/payments/stripe-client");
      const stripeRefund = await createStripeRefund({
        secretKey: process.env.STRIPE_SECRET_KEY!.trim(),
        paymentIntentId: paymentReference.startsWith("pi_") ? paymentReference : undefined,
        chargeId: paymentReference.startsWith("ch_") ? paymentReference : undefined,
        amount: claimed.amount,
        reason: "requested_by_customer",
        idempotencyKey: refundIdempotencyKey,
      });
      const status = mapStripeRefundStatus(stripeRefund.status);
      const updated = await updateRefundAfterAttempt(supabase, claimed, {
        status,
        externalId: stripeRefund.id,
        providerAttempt: {
          provider: "stripe",
          executed: true,
          providerStatus: stripeRefund.status,
          providerRefundId: stripeRefund.id,
          attemptedAt: new Date().toISOString(),
        },
        refundPlan,
        bookingFullyRefunded:
          status === "completed" && refundPlan.remainingAfterRefund.minorUnits === 0,
      });
      if ("error" in updated) {
        return { ok: false, error: updated.error, code: "STRIPE_FAILED" };
      }
      return { ok: true, transaction: updated.transaction, providerExecuted: true };
    } catch (error) {
      await updateRefundAfterAttempt(supabase, claimed, {
        status: "processing",
        providerAttempt: {
          provider: "stripe",
          executed: true,
          outcome: "uncertain",
          error: error instanceof Error ? error.message : "Stripe request failed",
          attemptedAt: new Date().toISOString(),
        },
        refundPlan,
        bookingFullyRefunded: false,
      });
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Не удалось выполнить возврат через Stripe",
        code: "STRIPE_FAILED",
      };
    }
  }

  const paymentId = refundPlan.charge.externalId!;

  try {
    const { createMercadoPagoRefund } = await import("@/lib/payments/mercadopago-client");
    const refund = await createMercadoPagoRefund({
      paymentId,
      amount: claimed.amount,
      idempotencyKey: refundIdempotencyKey,
    });
    const status = mapMercadoPagoRefundStatus(refund.status);
    const updated = await updateRefundAfterAttempt(supabase, claimed, {
      status,
      externalId: refund.refundId,
      providerAttempt: {
        provider: "mercadopago",
        executed: true,
        providerStatus: refund.status,
        providerRefundId: refund.refundId,
        attemptedAt: new Date().toISOString(),
      },
      refundPlan,
      bookingFullyRefunded:
        status === "completed" && refundPlan.remainingAfterRefund.minorUnits === 0,
    });
    if ("error" in updated) {
      return { ok: false, error: updated.error, code: "MP_FAILED" };
    }
    return { ok: true, transaction: updated.transaction, providerExecuted: true };
  } catch (error) {
    await updateRefundAfterAttempt(supabase, claimed, {
      status: "processing",
      providerAttempt: {
        provider: "mercadopago",
        executed: true,
        outcome: "uncertain",
        error: error instanceof Error ? error.message : "Mercado Pago request failed",
        attemptedAt: new Date().toISOString(),
      },
      refundPlan,
      bookingFullyRefunded: false,
    });
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
  const { data, error } = await supabase.rpc("reject_refund_request_atomic", {
    p_refund_id: transactionId,
    p_actor_user_id: adminUserId,
    p_admin_notes: adminNotes?.trim() || null,
  });

  if (error || !data) {
    return { error: error?.message ?? "Не удалось отклонить запрос" };
  }

  return { transaction: mapTransactionRow(data) };
}
