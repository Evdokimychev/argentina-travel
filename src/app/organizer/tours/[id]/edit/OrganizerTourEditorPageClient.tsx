"use client";

import { use } from "react";
import OrganizerShell from "@/components/organizer/OrganizerShell";
import OrganizerTourEditorView from "@/components/organizer/OrganizerTourEditorView";

export default function OrganizerTourEditorPageClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <OrganizerShell>
      <OrganizerTourEditorView tourId={id} />
    </OrganizerShell>
  );
}
