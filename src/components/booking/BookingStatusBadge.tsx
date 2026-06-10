import type { BookingStatus } from "@/types/tourist";
import {
  BOOKING_STATUS_TONE,
  getVisibleBookingStatusLabel,
  isActiveBookingStatus,
} from "@/data/booking-statuses";
import { cn } from "@/lib/cn";

export default function BookingStatusBadge({
  status,
  className,
}: {
  status: BookingStatus;
  className?: string;
}) {
  const displayStatus = isActiveBookingStatus(status) ? status : "pending";
  const label = getVisibleBookingStatusLabel(status);

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        BOOKING_STATUS_TONE[displayStatus],
        className
      )}
    >
      {label}
    </span>
  );
}
