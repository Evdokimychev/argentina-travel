"use client";

import OrganizerShell from "@/components/organizer/OrganizerShell";
import OrganizerDashboardView from "@/components/organizer/OrganizerDashboardView";

export default function OrganizerDashboardPageClient() {
  return (
    <OrganizerShell>
      <OrganizerDashboardView />
    </OrganizerShell>
  );
}
