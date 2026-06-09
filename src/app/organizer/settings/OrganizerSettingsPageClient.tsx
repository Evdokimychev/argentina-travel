"use client";

import OrganizerShell from "@/components/organizer/OrganizerShell";
import OrganizerSettingsView from "@/components/organizer/OrganizerSettingsView";

export default function OrganizerSettingsPageClient() {
  return (
    <OrganizerShell>
      <OrganizerSettingsView />
    </OrganizerShell>
  );
}
