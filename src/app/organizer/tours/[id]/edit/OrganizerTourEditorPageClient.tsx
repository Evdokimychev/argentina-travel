"use client";

import { Suspense, use } from "react";
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
      <Suspense fallback={<div className="text-sm text-slate">Загрузка редактора…</div>}>
        <OrganizerTourEditorView tourId={id} />
      </Suspense>
    </OrganizerShell>
  );
}
