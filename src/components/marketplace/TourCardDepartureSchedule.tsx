import { Zap } from "lucide-react";
import { formatDateRange } from "@/lib/utils";
import { formatMoreDates, formatSpots } from "@/lib/pluralize";
import { isLowAvailability } from "@/lib/tour-departure-countdown";
import type { TourCardScheduleDisplay } from "@/lib/tour-public-display";
import { cn } from "@/lib/cn";

const schedulePillClass =
  "inline-flex h-6 items-center gap-1 px-2 text-xs leading-none";

interface TourCardDepartureScheduleProps {
  schedule: Extract<TourCardScheduleDisplay, { type: "dates" }>;
  onMoreDatesClick?: () => void;
  className?: string;
}

export default function TourCardDepartureSchedule({
  schedule,
  onMoreDatesClick,
  className,
}: TourCardDepartureScheduleProps) {
  const lowSpots = isLowAvailability(schedule.spotsLeft);

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {lowSpots ? (
        <span
          className={cn(
            schedulePillClass,
            "max-w-full rounded-lg border border-gray-200 bg-white text-slate"
          )}
        >
          <span className="truncate">{formatDateRange(schedule.start, schedule.end)}</span>
          <Zap className="h-3 w-3 shrink-0 fill-wine text-wine" aria-hidden />
          <span className="shrink-0 font-semibold text-wine">{formatSpots(schedule.spotsLeft)}</span>
        </span>
      ) : (
        <span className="text-xs text-slate">
          {formatDateRange(schedule.start, schedule.end)}
        </span>
      )}

      {schedule.moreDates > 0 ? (
        onMoreDatesClick ? (
          <button
            type="button"
            className={cn(
              schedulePillClass,
              "pointer-events-auto relative z-10 rounded-full border border-sky/20 bg-sky/5 font-semibold text-sky-ink transition-colors hover:border-sky/35 hover:bg-sky/10"
            )}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onMoreDatesClick();
            }}
          >
            {formatMoreDates(schedule.moreDates)}
          </button>
        ) : (
          <span
            className={cn(schedulePillClass, "rounded-full bg-gray-100 font-medium text-slate")}
          >
            {formatMoreDates(schedule.moreDates)}
          </span>
        )
      ) : null}
    </div>
  );
}
