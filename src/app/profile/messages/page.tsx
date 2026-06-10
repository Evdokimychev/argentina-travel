"use client";

import { Suspense } from "react";
import MessagesInboxView from "@/components/messages/MessagesInboxView";

export default function ProfileMessagesPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate">Загрузка сообщений…</div>}>
      <MessagesInboxView role="tourist" basePath="/profile/messages" />
    </Suspense>
  );
}
