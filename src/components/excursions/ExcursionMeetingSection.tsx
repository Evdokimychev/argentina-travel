"use client";

import { MapPin } from "lucide-react";
import TourSection from "@/components/tour-detail/TourSection";
import type { ExcursionLocationPoint } from "@/types/excursion";

export default function ExcursionMeetingSection({
  meetingPoint,
  finishPoint,
  title,
  meetingLabel,
  finishLabel,
}: {
  meetingPoint?: ExcursionLocationPoint;
  finishPoint?: ExcursionLocationPoint;
  title: string;
  meetingLabel: string;
  finishLabel: string;
}) {
  if (!meetingPoint && !finishPoint) return null;

  return (
    <TourSection id="meeting" title={title}>
      <div className="grid gap-4 sm:grid-cols-2">
        {meetingPoint ? (
          <div className="rounded-2xl border border-gray-100 bg-surface-muted/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate">{meetingLabel}</p>
            <p className="mt-2 inline-flex items-start gap-2 text-sm leading-relaxed text-charcoal">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />
              {meetingPoint.text}
            </p>
          </div>
        ) : null}
        {finishPoint ? (
          <div className="rounded-2xl border border-gray-100 bg-surface-muted/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate">{finishLabel}</p>
            <p className="mt-2 inline-flex items-start gap-2 text-sm leading-relaxed text-charcoal">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />
              {finishPoint.text}
            </p>
          </div>
        ) : null}
      </div>
    </TourSection>
  );
}
