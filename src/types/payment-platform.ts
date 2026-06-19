import type { BookingPaymentStatus } from "@/types/booking-params";
import type { PaymentProviderId } from "@/types/payment-webhook";
import type { AnalyticsPeriod } from "@/types/admin-analytics";

/** Mercado Pago capture lifecycle — maps MP statuses to platform phases. */
export type MercadoPagoCapturePhase =
  | "authorized"
  | "captured"
  | "refunded"
  | "pending"
  | "failed";

export type PaymentReceiptMetadata = {
  providerStatus: string;
  capturePhase: MercadoPagoCapturePhase;
  statusDetail?: string;
  dateCreated?: string;
  dateApproved?: string;
  paymentMethodId?: string;
  authorizationCode?: string;
  providerPaymentId: string;
};

export type PaymentTransactionReceiptView = {
  transactionId: string;
  bookingId: string;
  provider: PaymentProviderId;
  externalId: string | null;
  amount: number;
  currency: string;
  status: PaymentTransactionStatus;
  type: PaymentTransactionType;
  paidAt: string | null;
  receipt: PaymentReceiptMetadata | null;
};

export type PaymentTransactionType = "charge" | "refund" | "payout";

export type PaymentTransactionStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "rejected";

export type PayoutRecordStatus =
  | "pending"
  | "approved"
  | "exported"
  | "completed"
  | "scheduled"
  | "paid"
  | "failed"
  | "cancelled";

export type PaymentTransactionRow = {
  id: string;
  bookingId: string;
  provider: PaymentProviderId;
  externalId: string | null;
  amount: number;
  currency: string;
  status: PaymentTransactionStatus;
  type: PaymentTransactionType;
  sourceEventId: string | null;
  requestedBy: string | null;
  approvedBy: string | null;
  requestReason: string | null;
  adminNotes: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  /** Joined from bookings when listing. */
  tourTitle?: string;
  contactEmail?: string;
};

export type PayoutRecordRow = {
  id: string;
  organizerUserId: string;
  period: string;
  amount: number;
  currency: string;
  status: PayoutRecordStatus;
  metadata: Record<string, unknown>;
  exportedAt: string | null;
  exportFileHash: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReconciliationTotals = {
  chargeCount: number;
  chargeAmount: number;
  refundCount: number;
  refundAmount: number;
  payoutCount: number;
  payoutAmount: number;
  netAmount: number;
  pendingRefundCount: number;
};

export type ReconciliationSnapshotRow = {
  id: string;
  snapshotDate: string;
  period: string | null;
  totals: ReconciliationTotals;
  discrepancies: ReconciliationDiscrepancy[];
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
};

export type ReconciliationDiscrepancy = {
  kind: "unmatched_charge" | "pending_refund" | "booking_mismatch";
  bookingId?: string;
  transactionId?: string;
  message: string;
};

export type PaymentTransactionFilters = {
  period?: AnalyticsPeriod;
  type?: PaymentTransactionType | "all";
  status?: PaymentTransactionStatus | "all";
  provider?: PaymentProviderId | "all";
  bookingId?: string;
};

export const PAYMENT_TRANSACTION_TYPE_LABELS: Record<PaymentTransactionType, string> = {
  charge: "Списание",
  refund: "Возврат",
  payout: "Выплата",
};

export const PAYMENT_TRANSACTION_STATUS_LABELS: Record<PaymentTransactionStatus, string> = {
  pending: "Ожидает",
  processing: "В обработке",
  completed: "Завершено",
  failed: "Ошибка",
  cancelled: "Отменено",
  rejected: "Отклонено",
};

export const PAYOUT_RECORD_STATUS_LABELS: Record<PayoutRecordStatus, string> = {
  pending: "Ожидает",
  approved: "Одобрено",
  exported: "Экспортировано",
  completed: "Завершено",
  scheduled: "Запланировано",
  paid: "Выплачено",
  failed: "Ошибка",
  cancelled: "Отменено",
};

export const PAYMENT_PROVIDER_LABELS: Record<PaymentProviderId, string> = {
  mercadopago: "Mercado Pago",
  stripe: "Stripe",
  manual: "Вручную",
};

export const MERCADOPAGO_CAPTURE_PHASE_LABELS: Record<MercadoPagoCapturePhase, string> = {
  authorized: "Авторизовано",
  captured: "Списано",
  refunded: "Возвращено",
  pending: "В обработке",
  failed: "Отклонено",
};

export const BOOKING_PAYMENT_STATUS_LABELS: Record<BookingPaymentStatus, string> = {
  pending: "Не оплачено",
  partial: "Частично оплачено",
  paid: "Оплачено",
  refunded: "Возвращено",
};
