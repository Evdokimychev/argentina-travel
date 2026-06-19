"use client";

import { useEffect, useRef } from "react";
import { isSupabaseMessagingEnabled } from "@/lib/auth-mode";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  ConversationMessage,
  ConversationThread,
} from "@/types/conversations";

type RealtimeMessageRow = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

function mapRealtimeRow(
  thread: ConversationThread,
  row: RealtimeMessageRow
): ConversationMessage {
  const senderRole =
    row.sender_id === thread.organizerUserId ? "organizer" : "tourist";

  return {
    id: row.id,
    threadId: row.thread_id,
    senderId: row.sender_id,
    senderRole,
    body: row.body,
    createdAt: row.created_at,
  };
}

export function useConversationRealtime(
  thread: ConversationThread | null,
  onMessage: (message: ConversationMessage) => void
) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!thread || !isSupabaseMessagingEnabled()) return;

    let client;
    try {
      client = createSupabaseBrowserClient();
    } catch {
      return;
    }

    const channel = client
      .channel(`conversation:${thread.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_messages",
          filter: `thread_id=eq.${thread.id}`,
        },
        (payload) => {
          const row = payload.new as RealtimeMessageRow;
          onMessageRef.current(mapRealtimeRow(thread, row));
        }
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [thread]);
}
