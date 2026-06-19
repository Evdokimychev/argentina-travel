"use client";

import { useEffect, useRef } from "react";
import { isSupabaseMessagingEnabled } from "@/lib/auth-mode";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function useConversationInboxRealtime(
  enabled: boolean,
  onEvent: () => void
): void {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !isSupabaseMessagingEnabled()) return;

    let client;
    try {
      client = createSupabaseBrowserClient();
    } catch {
      return;
    }

    const channel = client
      .channel(`conversation-inbox:${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversation_messages" },
        () => onEventRef.current()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "message_reads" },
        () => onEventRef.current()
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [enabled]);
}
