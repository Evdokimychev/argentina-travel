import {
  BOOKING_PAYMENT_STATUS_LABELS,
  resolveBookingPaymentStatus,
} from "@/lib/booking-params";
import type { Booking } from "@/types/tourist";
import type { BookingPaymentStatus } from "@/types/booking-params";
import { cn } from "@/lib/cn";

const PAYMENT_STATUS_TONE: Record<BookingPaymentStatus, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200/80",
  partial: "bg-sky-50 text-sky-800 ring-sky-200/80",
  paid: "bg-emerald-50 text-emerald-800 ring-emerald-200/80",
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
