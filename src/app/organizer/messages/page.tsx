"use client";

import { Suspense } from "react";
import OrganizerShell from "@/components/organizer/OrganizerShell";
import MessagesInboxView from "@/components/messages/MessagesInboxView";

export default function OrganizerMessagesPage() {
  return (
    <OrganizerShell>
      <Suspense fallback={<div className="text-sm text-slate">Загрузка сообщений…</div>}>
        <MessagesInboxView role="organizer" basePath="/organizer/messages" />
      </Suspense>
    </OrganizerShell>
  );
}
