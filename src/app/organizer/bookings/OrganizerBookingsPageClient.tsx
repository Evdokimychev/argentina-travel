"use client";

import OrganizerShell from "@/components/organizer/OrganizerShell";
import OrganizerBookingsView from "@/components/organizer/OrganizerBookingsView";

export default function OrganizerBookingsPageClient() {
  return (
    <OrganizerShell>
      <OrganizerBookingsView />
    </OrganizerShell>
  );
}
