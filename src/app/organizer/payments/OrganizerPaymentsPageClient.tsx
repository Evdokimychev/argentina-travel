"use client";

import OrganizerShell from "@/components/organizer/OrganizerShell";
import OrganizerPaymentsView from "@/components/organizer/OrganizerPaymentsView";

export default function OrganizerPaymentsPageClient() {
  return (
    <OrganizerShell>
      <OrganizerPaymentsView />
    </OrganizerShell>
  );
}
