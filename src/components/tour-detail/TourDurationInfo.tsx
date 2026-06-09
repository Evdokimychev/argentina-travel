import { CalendarDays } from "lucide-react";
import { formatDays, formatNights } from "@/lib/pluralize";
import { cn } from "@/lib/cn";

interface TourDurationInfoProps {
  days: number;
  nights: number;
  className?: string;
}

export default function TourDurationInfo({ days, nights, className }: TourDurationInfoProps) {
  const showNights = nights > 0;

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-100 bg-white px-2.5 py-2 shadow-sm",
        className
      )}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sky/10 text-sky">
        <CalendarDays className="h-3.5 w-3.5 stroke-[1.75]" aria-hidden />
      </span>
      <div className="text-right leading-tight">
        <p className="text-sm font-semibold text-charcoal">{formatDays(days)}</p>
        {showNights && (
          <p className="mt-0.5 text-[11px] text-slate">{formatNights(nights)}</p>
        )}
      </div>
    </div>
  );
}
