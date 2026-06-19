import type { BookingStatusChange } from "@/types/tourist";
import {
  BOOKING_STATUS_ACTOR_LABELS,
  getVisibleBookingStatusLabel,
} from "@/data/booking-statuses";
import { formatBookingDateTime } from "@/lib/booking-datetime";

export default function BookingStatusTimeline({
  history,
}: {
  history: BookingStatusChange[];
}) {
  const items = [...history].sort(
    (a, b) => a.changedAt.localeCompare(b.changedAt)
  );

  if (items.length === 0) return null;

  return (
    <ol className="space-y-0">
      {items.map((entry, index) => {
        const { date, time } = formatBookingDateTime(entry.changedAt);
        const isLast = index === items.length - 1;

        return (
          <li key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast ? (
              <span
                className="absolute left-[11px] top-6 h-[calc(100%-12px)] w-px bg-gray-200"
                aria-hidden
              />
            ) : null}
            <span
              className="relative z-[1] mt-1.5 h-[22px] w-[22px] shrink-0 rounded-full border-2 border-brand bg-white"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-charcoal">
                {getVisibleBookingStatusLabel(entry.to)}
              </p>
              <p className="mt-0.5 text-sm text-slate">
                {date}
                {time ? ` ${time}` : ""}
              </p>
              <p className="mt-0.5 text-sm text-slate">
                {BOOKING_STATUS_ACTOR_LABELS[entry.changedBy]}
              </p>
              {entry.note ? (
                <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-charcoal">
                  {entry.note}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
