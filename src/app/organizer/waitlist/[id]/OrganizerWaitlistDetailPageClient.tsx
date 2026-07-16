"use client";

import OrganizerWaitlistDetailView from "@/components/organizer/OrganizerWaitlistDetailView";
import OrganizerShell from "@/components/organizer/OrganizerShell";

export default function OrganizerWaitlistDetailPageClient({
  waitlistId,
}: {
  waitlistId: string;
}) {
  return (
    <OrganizerShell>
      <OrganizerWaitlistDetailView waitlistId={waitlistId} />
    </OrganizerShell>
  );
}
