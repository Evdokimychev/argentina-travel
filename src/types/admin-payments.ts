import type { BookingCheckoutPaymentOption, BookingPaymentStatus } from "@/types/booking-params";
import type { BookingPaymentLinkStatus } from "@/types/booking-payment";
import type { AnalyticsPeriod } from "@/types/admin-analytics";
import type { CurrencyCode } from "@/types/locale";

export type AdminPaymentStatusFilter = BookingPaymentStatus | "all";

export type AdminPaymentPeriodFilter = AnalyticsPeriod;

export type BookingPaymentOverview = {
  bookingId: string;
  tourTitle: string;
  contactEmail: string;
  paymentStatus: BookingPaymentStatus;
  amountDue: number;
  amountPaid: number;
  currency: CurrencyCode;
  checkoutPaymentOption: BookingCheckoutPaymentOption | null;
  paymentLinkStatus: BookingPaymentLinkStatus | "none";
  organizerUserId: string | null;
};

export type AdminPaymentsSummaryStats = {
  byStatus: Record<BookingPaymentStatus, number>;
  totalDue: number;
  totalPaid: number;
};

export const ADMIN_PAYMENT_STATUS_LABELS: Record<BookingPaymentStatus, string> = {
  pending: "Ожидает оплаты",
  partial: "Частичная оплата",
  paid: "Оплачено полностью",
  refunded: "Возврат оформлен",
};

export const ADMIN_PAYMENT_STATUS_FILTER_LABELS: Record<AdminPaymentStatusFilter, string> = {
  all: "Все статусы",
  ...ADMIN_PAYMENT_STATUS_LABELS,
};
