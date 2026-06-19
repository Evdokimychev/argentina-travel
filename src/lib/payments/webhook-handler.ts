import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type { BookingPaymentStatus } from "@/types/booking-params";
import type {
  BookingPaymentWebhookPatch,
  PaymentWebhookEvent,
  PaymentWebhookParseResult,
  PaymentProviderId,
} from "@/types/payment-webhook";

type DbClient = SupabaseClient<Database>;
type JsonRecord = Record<string, unknown>;

type ParseWebhookInput = {
  provider: PaymentProviderId;
  payload: unknown;
  signatureHeader?: string | null;
  /**
   * Use provider secret from env:
   * - MERCADOPAGO_WEBHOOK_SECRET
   * - STRIPE_WEBHOOK_SECRET
   */
  secret?: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function readPath(source: Record<string, unknown>, path: string): unknown {
  const segments = path.split(".");
  let current: unknown = source;

  for (const segment of segments) {
    const record = asRecord(current);
    if (!record) return undefined;
    current = record[segment];
  }

  return current;
}

function pickString(source: Record<string, unknown>, paths: string[]): string | undefined {
  for (const path of paths) {
    const value = readPath(source, path);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function pickNumber(source: Record<string, unknown>, paths: string[]): number | undefined {
  for (const path of paths) {
    const value = readPath(source, path);
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function normalizePaymentStatus(rawStatus: string | undefined): PaymentWebhookEvent["paymentStatus"] {
  const normalized = rawStatus?.trim().toLowerCase();
  if (!normalized) return "pending";

  if (
    normalized === "paid" ||
    normalized === "approved" ||
    normalized === "succeeded" ||
    normalized === "payment_intent.succeeded"
  ) {
    return "paid";
  }

  if (normalized === "partial" || normalized === "partially_paid") {
    return "partial";
  }

  if (
    normalized === "refunded" ||
    normalized === "charge.refunded" ||
    normalized === "refund" ||
    normalized === "cancelled"
  ) {
    return "refunded";
  }

  return "pending";
}

function normalizeOccurredAt(raw: string | undefined): string {
  if (!raw) return new Date().toISOString();
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

function verifySignature(signatureHeader: string | null | undefined, secret: string | null | undefined): boolean {
  if (!secret?.trim()) return true;
  if (!signatureHeader?.trim()) return false;
  return signatureHeader.trim() === secret.trim();
}

type SafePaymentSummary = {
  totalAmountUsd: number;
  paidAmountUsd: number;
  remainingAmountUsd: number;
  serviceFeeUsd: number;
};

function normalizeSummary(raw: unknown, fallbackTotal: number): SafePaymentSummary {
  const record = asRecord(raw);
  const totalRaw = record?.totalAmountUsd;
  const paidRaw = record?.paidAmountUsd;
  const remainingRaw = record?.remainingAmountUsd;
  const serviceFeeRaw = record?.serviceFeeUsd;

  const totalAmountUsd =
    typeof totalRaw === "number" && Number.isFinite(totalRaw) && totalRaw >= 0
      ? totalRaw
      : Math.max(0, fallbackTotal);
  const paidAmountUsd =
    typeof paidRaw === "number" && Number.isFinite(paidRaw) && paidRaw >= 0
      ? Math.min(paidRaw, totalAmountUsd || paidRaw)
      : 0;
  const remainingAmountUsd =
    typeof remainingRaw === "number" && Number.isFinite(remainingRaw) && remainingRaw >= 0
      ? remainingRaw
      : Math.max(0, totalAmountUsd - paidAmountUsd);
  const serviceFeeUsd =
    typeof serviceFeeRaw === "number" && Number.isFinite(serviceFeeRaw) && serviceFeeRaw >= 0
      ? serviceFeeRaw
      : 0;

  return {
    totalAmountUsd,
    paidAmountUsd,
    remainingAmountUsd,
    serviceFeeUsd,
  };
}

/**
 * Booking payment state machine (E28/E41):
 * pending -> partial -> paid; paid/partial -> refunded via webhook or admin.
 */
function normalizeStateMachineStatus(status: unknown): BookingPaymentStatus {
  if (
    status === "paid" ||
    status === "partial" ||
    status === "pending" ||
    status === "refunded"
  ) {
    return status;
  }
  return "pending";
}

function resolveNextPaymentStatus(
  currentStatus: BookingPaymentStatus,
  incomingStatus: BookingPaymentStatus
): BookingPaymentStatus {
  if (incomingStatus === "refunded") return "refunded";
  if (currentStatus === "refunded") return "refunded";
  if (currentStatus === "paid") return "paid";
  if (currentStatus === "partial") {
    return incomingStatus === "paid" ? "paid" : "partial";
  }
  if (incomingStatus === "paid") return "paid";
  if (incomingStatus === "partial") return "partial";
  return "pending";
}

function resolvePaidAmountUsd(input: {
  status: BookingPaymentStatus;
  totalAmountUsd: number;
  requestedPaidUsd: number;
  currentPaidUsd: number;
}): number {
  const total = Math.max(0, input.totalAmountUsd);
  const requested = Math.max(0, input.requestedPaidUsd);
  const current = Math.max(0, input.currentPaidUsd);

  if (input.status === "pending") return 0;
  if (input.status === "paid") return total > 0 ? total : requested;
  if (total <= 0) return Math.max(current, requested);

  const normalizedRequested = Math.min(requested, total);
  if (normalizedRequested > 0 && normalizedRequested < total) {
    return normalizedRequested;
  }

  const fallback = Math.max(1, Math.round(total / 2));
  return Math.min(fallback, Math.max(1, total - 1));
}

export function parseAndValidateWebhook(input: ParseWebhookInput): PaymentWebhookParseResult {
  const rawPayload = asRecord(input.payload);
  if (!rawPayload) {
    return {
      verified: false,
      event: null,
      error: "Invalid webhook payload",
    };
  }

  const bookingId = pickString(rawPayload, [
    "bookingId",
    "booking_id",
    "metadata.bookingId",
    "metadata.booking_id",
    "data.object.metadata.bookingId",
    "data.object.metadata.booking_id",
  ]);

  if (!bookingId) {
    return {
      verified: false,
      event: null,
      error: "Missing bookingId in webhook payload",
    };
  }

  const event: PaymentWebhookEvent = {
    provider: input.provider,
    eventId:
      pickString(rawPayload, ["eventId", "event_id", "id", "data.id"]) ??
      `${input.provider}-${Date.now().toString(36)}`,
    eventType:
      pickString(rawPayload, ["eventType", "event_type", "type", "data.type"]) ??
      "payment.updated",
    bookingId,
    paymentStatus: normalizePaymentStatus(
      pickString(rawPayload, [
        "paymentStatus",
        "payment_status",
        "status",
        "data.object.status",
        "data.status",
      ])
    ),
    amountPaidUsd: pickNumber(rawPayload, [
      "amountPaidUsd",
      "amount_paid_usd",
      "amountPaid",
      "amount_paid",
      "data.object.amount_received",
      "data.object.amount_paid",
    ]),
    amountTotalUsd: pickNumber(rawPayload, [
      "amountTotalUsd",
      "amount_total_usd",
      "amountTotal",
      "amount_total",
      "data.object.amount",
      "data.object.amount_total",
    ]),
    occurredAt: normalizeOccurredAt(
      pickString(rawPayload, [
        "occurredAt",
        "occurred_at",
        "createdAt",
        "created_at",
        "data.object.created",
      ])
    ),
    rawPayload,
  };

  return {
    verified: verifySignature(input.signatureHeader, input.secret),
    event,
  };
}

export function mapWebhookToBookingPaymentUpdate(
  event: PaymentWebhookEvent,
  verified = true
): BookingPaymentWebhookPatch {
  const totalAmountUsd = Math.max(0, Math.round(event.amountTotalUsd ?? event.amountPaidUsd ?? 0));
  let paidAmountUsd = Math.max(0, Math.round(event.amountPaidUsd ?? 0));

  if (event.paymentStatus === "paid" && paidAmountUsd === 0) {
    paidAmountUsd = totalAmountUsd;
  }
  if (event.paymentStatus === "pending" || event.paymentStatus === "refunded") {
    paidAmountUsd = 0;
  }

  const normalizedPaid =
    totalAmountUsd > 0 ? Math.min(paidAmountUsd, totalAmountUsd) : paidAmountUsd;

  return {
    verified,
    paymentStatus: event.paymentStatus,
    paymentSummary: {
      totalAmountUsd,
      paidAmountUsd: normalizedPaid,
      remainingAmountUsd: Math.max(0, totalAmountUsd - normalizedPaid),
      serviceFeeUsd: 0,
    },
    sourceEventId: event.eventId,
    provider: event.provider,
    occurredAt: event.occurredAt,
  };
}

export async function applyPaymentWebhookPatch(
  supabase: DbClient,
  bookingId: string,
  patch: BookingPaymentWebhookPatch
): Promise<boolean> {
  if (!patch.verified) return false;

  const { data, error } = await supabase
    .from("bookings")
    .select("id, payload, total_price_usd, payment_status")
    .eq("id", bookingId)
    .maybeSingle();

  if (error || !data) return false;

  const payload = asRecord(data.payload) ?? {};
  const currentSummary = normalizeSummary(payload.paymentSummary, Number(data.total_price_usd) || 0);
  const currentStatus = normalizeStateMachineStatus(payload.paymentStatus ?? data.payment_status);
  const incomingStatus = normalizeStateMachineStatus(patch.paymentStatus);
  const nextPaymentStatus = resolveNextPaymentStatus(currentStatus, incomingStatus);
  const patchSummary = patch.paymentSummary;

  const totalAmountUsd =
    patchSummary.totalAmountUsd > 0 ? patchSummary.totalAmountUsd : currentSummary.totalAmountUsd;
  const paidAmountUsd = resolvePaidAmountUsd({
    status: nextPaymentStatus,
    totalAmountUsd,
    requestedPaidUsd:
      totalAmountUsd > 0
        ? Math.min(Math.max(0, patchSummary.paidAmountUsd), totalAmountUsd)
        : Math.max(0, patchSummary.paidAmountUsd),
    currentPaidUsd: currentSummary.paidAmountUsd,
  });
  const remainingAmountUsd = Math.max(0, totalAmountUsd - paidAmountUsd);
  const serviceFeeUsd =
    patchSummary.serviceFeeUsd > 0 ? patchSummary.serviceFeeUsd : currentSummary.serviceFeeUsd;

  const currentPaymentLink = asRecord(payload.paymentLink);
  const nextPaymentLink =
    currentPaymentLink && nextPaymentStatus === "paid"
      ? ({
          ...currentPaymentLink,
          status: "paid",
          paidAt: patch.occurredAt,
        } as JsonRecord)
      : currentPaymentLink && nextPaymentStatus === "refunded"
        ? ({
            ...currentPaymentLink,
            status: "cancelled",
          } as JsonRecord)
        : payload.paymentLink;

  const nextPayload: Record<string, unknown> = {
    ...payload,
    paymentStatus: nextPaymentStatus,
    paymentSummary: {
      totalAmountUsd,
      paidAmountUsd,
      remainingAmountUsd,
      serviceFeeUsd,
    },
    amountPaid: paidAmountUsd,
    amountDue: remainingAmountUsd,
    paymentLink: nextPaymentLink,
  };

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      payment_status: nextPaymentStatus,
      payload: nextPayload as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  return !updateError;
}

export type PersistWebhookTransactionInput = {
  bookingId: string;
  patch: BookingPaymentWebhookPatch;
  externalId: string;
  amount: number;
  currency?: string;
  receiptMetadata?: Record<string, unknown>;
};

/** Persist charge row after webhook patch — idempotent on provider + external_id. */
export async function persistWebhookChargeTransaction(
  supabase: DbClient,
  input: PersistWebhookTransactionInput
): Promise<void> {
  if (!input.patch.verified || !input.externalId.trim()) return;

  try {
    const { upsertChargeFromWebhook } = await import("@/lib/payments/transaction-server");
    const transaction = await upsertChargeFromWebhook(supabase, {
      bookingId: input.bookingId,
      provider: input.patch.provider,
      externalId: input.externalId,
      amount: input.amount,
      currency: input.currency,
      patch: input.patch,
      receiptMetadata: input.receiptMetadata,
    });

    if (transaction?.status === "completed" && transaction.type === "charge") {
      const { data: booking } = await supabase
        .from("bookings")
        .select("organizer_user_id")
        .eq("id", input.bookingId)
        .maybeSingle();

      const organizerUserId = booking?.organizer_user_id?.trim();
      if (organizerUserId) {
        const { createCommissionSnapshotForCharge } = await import("@/lib/payments/commission-server");
        await createCommissionSnapshotForCharge(supabase, {
          bookingId: input.bookingId,
          paymentTransactionId: transaction.id,
          organizerUserId,
          grossAmount: transaction.amount,
          currency: transaction.currency,
        });
      }
    }
  } catch {
    // Ledger persistence must not break webhook processing
  }
}
