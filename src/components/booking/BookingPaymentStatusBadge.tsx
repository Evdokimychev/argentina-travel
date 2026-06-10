import {
  BOOKING_PAYMENT_STATUS_LABELS,
  resolveBookingPaymentStatus,
} from "@/lib/booking-params";
import type { Booking } from "@/types/tourist";
import type { BookingPaymentStatus } from "@/types/booking-params";
import { cn } from "@/lib/cn";

const PAYMENT_STATUS_TONE: Record<BookingPaymentStatus, string> = {
  pending: "bg-warning-muted text-warning ring-warning/20",
  partial: "bg-sky/10 text-sky ring-sky/20",
  paid: "bg-success-muted text-success ring-success/20",
  refunded: "bg-gray-100 text-slate ring-gray-200/80",
};

export default function BookingPaymentStatusBadge({
  booking,
  status: statusProp,
  className,
}: {
  booking?: Booking;
  status?: BookingPaymentStatus;
  className?: string;
}) {
  const status = statusProp ?? (booking ? resolveBookingPaymentStatus(booking) : "pending");

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        PAYMENT_STATUS_TONE[status],
        className
      )}
    >
      {BOOKING_PAYMENT_STATUS_LABELS[status]}
    </span>
  );
}
