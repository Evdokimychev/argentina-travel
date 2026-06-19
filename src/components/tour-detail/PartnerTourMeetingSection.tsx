"use client";

import ExcursionMeetingSection from "@/components/excursions/ExcursionMeetingSection";
import type { PartnerTourContent } from "@/lib/tripster/partner-tour-content";

export default function PartnerTourMeetingSection({
  content,
}: {
  content: PartnerTourContent;
}) {
  if (!content.meetingPoint && !content.finishPoint) return null;

  return (
    <ExcursionMeetingSection
      meetingPoint={content.meetingPoint ? { text: content.meetingPoint } : undefined}
      finishPoint={content.finishPoint ? { text: content.finishPoint } : undefined}
      title="Встреча и финиш"
      meetingLabel="Старт"
      finishLabel="Финиш"
    />
  );
}
