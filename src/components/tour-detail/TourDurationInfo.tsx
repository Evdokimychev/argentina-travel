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
        "inline-flex items-center gap-2 rounded-full border border-sky/15 bg-sky/5 px-3 py-1.5 text-sm",
        className
      )}
    >
      <CalendarDays className="h-4 w-4 shrink-0 text-sky" aria-hidden />
      <span className="font-semibold text-charcoal">{formatDays(days)}</span>
      {showNights ? (
        <>
          <span className="text-gray-300" aria-hidden>
            ·
          </span>
          <span className="text-slate">{formatNights(nights)}</span>
        </>
      ) : null}
    </div>
  );
}
