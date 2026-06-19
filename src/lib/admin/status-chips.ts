import { BOOKING_STATUS_LABELS, BOOKING_STATUS_TONE, isActiveBookingStatus } from "@/data/booking-statuses";
import { BOOKING_PAYMENT_STATUS_LABELS } from "@/lib/booking-params";
import type { BookingPaymentStatus } from "@/types/booking-params";
import type { BookingStatus } from "@/types/tourist";
import {
  PAYMENT_TRANSACTION_STATUS_LABELS,
  type PaymentTransactionStatus,
} from "@/types/payment-platform";

export type AdminStatusChipDomain =
  | "booking"
  | "booking-payment"
  | "payment-transaction"
  | "moderation"
  | "moderation-entity"
  | "review"
  | "tour-catalog";

type ChipTone = string;

const TOUR_CATALOG_STATUS_LABELS: Record<string, string> = {
  draft: "Черновик",
  published: "Опубликован",
  archived: "В архиве",
};

const TOUR_CATALOG_STATUS_TONE: Record<string, ChipTone> = {
  draft: "bg-gray-100 text-slate ring-gray-200/60",
  published: "bg-success-muted text-success ring-success/30",
  archived: "bg-warning-muted text-warning ring-warning/30",
};

const MODERATION_STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  in_review: "На проверке",
  approved: "Одобрено",
  rejected: "Отклонено",
  none: "Не требуется",
};

const MODERATION_STATUS_TONE: Record<string, ChipTone> = {
  pending: "bg-warning-muted text-warning ring-warning/30",
  in_review: "bg-sky/10 text-sky ring-sky/20",
  approved: "bg-success-muted text-success ring-success/30",
  rejected: "bg-red-50 text-red-700 ring-red-200/80",
  none: "bg-gray-100 text-slate ring-gray-200/60",
};

const MODERATION_ENTITY_LABELS: Record<string, string> = {
  tour: "Тур",
  review: "Отзыв",
  review_report: "Жалоба на отзыв",
};

const MODERATION_ENTITY_TONE: Record<string, ChipTone> = {
  tour: "bg-amber-100 text-amber-800 ring-amber-200/80",
  review: "bg-sky/10 text-sky ring-sky/20",
  review_report: "bg-warning-muted text-warning ring-warning/30",
};

const REVIEW_STATUS_LABELS: Record<string, string> = {
  pending: "На модерации",
  published: "Опубликован",
  hidden: "Скрыт",
  rejected: "Отклонён",
};

const REVIEW_STATUS_TONE: Record<string, ChipTone> = {
  pending: "bg-warning-muted text-warning ring-warning/30",
  published: "bg-success-muted text-success ring-success/30",
  hidden: "bg-gray-100 text-slate ring-gray-200/60",
  rejected: "bg-red-50 text-red-700 ring-red-200/80",
};

const PAYMENT_TRANSACTION_TONE: Record<PaymentTransactionStatus, ChipTone> = {
  pending: "bg-warning-muted text-warning ring-warning/30",
  processing: "bg-sky/10 text-sky ring-sky/20",
  completed: "bg-success-muted text-success ring-success/30",
  failed: "bg-red-50 text-red-700 ring-red-200/80",
  cancelled: "bg-gray-100 text-slate ring-gray-200/60",
  rejected: "bg-red-50 text-red-700 ring-red-200/80",
};

const BOOKING_PAYMENT_TONE: Record<BookingPaymentStatus, ChipTone> = {
  pending: "bg-warning-muted text-warning ring-warning/20",
  partial: "bg-sky/10 text-sky ring-sky/20",
  paid: "bg-success-muted text-success ring-success/20",
  refunded: "bg-gray-100 text-slate ring-gray-200/80",
};

const NEUTRAL_TONE = "bg-gray-100 text-slate ring-gray-200/60";

export function resolveAdminStatusChip(
  domain: AdminStatusChipDomain,
  value: string
): { label: string; tone: string } {
  switch (domain) {
    case "booking": {
      const status = value as BookingStatus;
      const display = isActiveBookingStatus(status) ? status : "pending";
      return {
        label: BOOKING_STATUS_LABELS[status] ?? value,
        tone: BOOKING_STATUS_TONE[display] ?? NEUTRAL_TONE,
      };
    }
    case "booking-payment": {
      const status = value as BookingPaymentStatus;
      return {
        label: BOOKING_PAYMENT_STATUS_LABELS[status] ?? value,
        tone: BOOKING_PAYMENT_TONE[status] ?? NEUTRAL_TONE,
      };
    }
    case "payment-transaction": {
      const status = value as PaymentTransactionStatus;
      return {
        label: PAYMENT_TRANSACTION_STATUS_LABELS[status] ?? value,
        tone: PAYMENT_TRANSACTION_TONE[status] ?? NEUTRAL_TONE,
      };
    }
    case "moderation":
      return {
        label: MODERATION_STATUS_LABELS[value] ?? value,
        tone: MODERATION_STATUS_TONE[value] ?? NEUTRAL_TONE,
      };
    case "moderation-entity":
      return {
        label: MODERATION_ENTITY_LABELS[value] ?? value,
        tone: MODERATION_ENTITY_TONE[value] ?? NEUTRAL_TONE,
      };
    case "review":
      return {
        label: REVIEW_STATUS_LABELS[value] ?? value,
        tone: REVIEW_STATUS_TONE[value] ?? NEUTRAL_TONE,
      };
    case "tour-catalog":
      return {
        label: TOUR_CATALOG_STATUS_LABELS[value] ?? value,
        tone: TOUR_CATALOG_STATUS_TONE[value] ?? NEUTRAL_TONE,
      };
    default:
      return { label: value, tone: NEUTRAL_TONE };
  }
}
