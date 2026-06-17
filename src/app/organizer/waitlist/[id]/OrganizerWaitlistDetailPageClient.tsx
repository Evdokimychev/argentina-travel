"use client";

import OrganizerWaitlistDetailView from "@/components/organizer/OrganizerWaitlistDetailView";

export default function OrganizerWaitlistDetailPageClient({
  waitlistId,
}: {
  waitlistId: string;
}) {
  return <OrganizerWaitlistDetailView waitlistId={waitlistId} />;
}
