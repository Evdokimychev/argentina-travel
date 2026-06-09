"use client";

import OrganizerShell from "@/components/organizer/OrganizerShell";
import OrganizerPlaceholderSection from "@/components/organizer/OrganizerPlaceholderSection";

export default function OrganizerSectionPageClient({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <OrganizerShell>
      <OrganizerPlaceholderSection title={title} description={description} />
    </OrganizerShell>
  );
}
