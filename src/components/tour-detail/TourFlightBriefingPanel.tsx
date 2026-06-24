"use client";

import TourFlightBriefingBlocks from "@/components/tour-detail/TourFlightBriefingBlocks";
import type { TourFlightBriefing } from "@/lib/flights/tour-flight-prefill";
import { cn } from "@/lib/cn";

export default function TourFlightBriefingPanel({
  briefing,
  compact = false,
}: {
  briefing: TourFlightBriefing;
  compact?: boolean;
}) {
  if (compact) {
    return <TourFlightBriefingBlocks briefing={briefing} dense className="mt-0" />;
  }

  return (
    <div className="space-y-3">
      <TourFlightBriefingBlocks briefing={briefing} />

      {briefing.routeNote ? (
        <p className="rounded-lg bg-sky/[0.06] px-3 py-2 text-xs leading-relaxed text-slate">
          {briefing.routeNote}
        </p>
      ) : null}
    </div>
  );
}
