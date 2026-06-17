import type { WaitlistStatus } from "@/types/waitlist";
import { WAITLIST_STATUS_LABELS, WAITLIST_STATUS_TONE } from "@/data/waitlist-statuses";
import { cn } from "@/lib/cn";

export default function WaitlistStatusBadge({
  status,
  className,
}: {
  status: WaitlistStatus;
  className?: string;
}) {
  const tone =
    status in WAITLIST_STATUS_TONE
      ? WAITLIST_STATUS_TONE[status as keyof typeof WAITLIST_STATUS_TONE]
      : "bg-gray-100 text-slate ring-gray-200/60";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        tone,
        className
      )}
    >
      {WAITLIST_STATUS_LABELS[status]}
    </span>
  );
}
