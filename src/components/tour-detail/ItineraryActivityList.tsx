"use client";

import { getItineraryActivityLabel } from "@/data/itinerary-activity-kinds";
import { formatDayActivityMetadata } from "@/lib/tour-itinerary-activity";
import type { TourDayActivity } from "@/types/tour-itinerary-activity";
import { cn } from "@/lib/cn";
import { ItineraryActivityIllustration } from "./itinerary-activity-illustrations";

interface ItineraryActivityListProps {
  activities: TourDayActivity[];
  className?: string;
  compact?: boolean;
  variant?: "default" | "itinerary";
}

export default function ItineraryActivityList({
  activities,
  className,
  compact = false,
  variant = "itinerary",
}: ItineraryActivityListProps) {
  if (!activities.length) return null;

  const isItinerary = variant === "itinerary";
  const dense = isItinerary || compact;

  return (
    <ul className={cn(isItinerary ? "space-y-0" : "divide-y divide-gray-100", className)}>
      {activities.map((activity, index) => {
        const label = getItineraryActivityLabel(activity);
        const metadata = formatDayActivityMetadata(activity);
        const description = activity.description?.trim();

        return (
          <li
            key={activity.id}
            className={cn(
              "flex items-start",
              dense ? "gap-2.5 py-2" : "gap-3.5 py-2.5",
              isItinerary && index > 0 && "border-t border-gray-100/80"
            )}
          >
            <ItineraryActivityIllustration kind={activity.kind} compact={dense} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
                <p className={cn("font-medium leading-snug text-charcoal", dense ? "text-sm" : "text-[15px]")}>
                  {label}
                </p>
                {metadata ? (
                  <p className="text-xs tabular-nums leading-snug text-slate">{metadata}</p>
                ) : null}
              </div>
              {description ? (
                <p className={cn("leading-snug text-slate", dense ? "mt-0.5 text-xs" : "mt-1.5 text-sm")}>
                  {description}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
