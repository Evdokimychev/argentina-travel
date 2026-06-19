"use client";

import { useEffect, useRef, useState } from "react";
import { isSupabaseMessagingEnabled } from "@/lib/auth-mode";
import { TYPING_PRESENCE_TTL_SECONDS } from "@/lib/messaging/constants";
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

type RealtimeReadRow = {
  user_id: string;
  message_id: string;
  read_at: string;
};

type RealtimeTypingRow = {
  thread_id: string;
  user_id: string;
  updated_at: string;
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

function isTypingFresh(updatedAt: string): boolean {
  const age = Date.now() - new Date(updatedAt).getTime();
  return age >= 0 && age <= TYPING_PRESENCE_TTL_SECONDS * 1000;
}

export interface ConversationRealtimeHandlers {
  onMessage?: (message: ConversationMessage) => void;
  onReadReceipt?: (payload: {
    messageId: string;
    userId: string;
    readAt: string;
  }) => void;
  onTypingChange?: (payload: { userId: string; updatedAt: string | null }) => void;
}

export function useConversationRealtime(
  thread: ConversationThread | null,
  handlers: ConversationRealtimeHandlers,
  currentUserId?: string | null
): { realtimeActive: boolean } {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const [realtimeActive, setRealtimeActive] = useState(false);

  useEffect(() => {
    if (!thread || !isSupabaseMessagingEnabled()) {
      setRealtimeActive(false);
      return;
    }

    let client;
    try {
      client = createSupabaseBrowserClient();
    } catch {
      setRealtimeActive(false);
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
          handlersRef.current.onMessage?.(mapRealtimeRow(thread, row));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message_reads",
        },
        (payload) => {
          const row = payload.new as RealtimeReadRow;
          if (row.user_id === currentUserId) return;
          handlersRef.current.onReadReceipt?.({
            messageId: row.message_id,
            userId: row.user_id,
            readAt: row.read_at,
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "typing_presence",
          filter: `thread_id=eq.${thread.id}`,
        },
        (payload) => {
          const row = payload.new as RealtimeTypingRow;
          if (row.user_id === currentUserId) return;
          if (!isTypingFresh(row.updated_at)) return;
          handlersRef.current.onTypingChange?.({
            userId: row.user_id,
            updatedAt: row.updated_at,
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "typing_presence",
          filter: `thread_id=eq.${thread.id}`,
        },
        (payload) => {
          const row = payload.new as RealtimeTypingRow;
          if (row.user_id === currentUserId) return;
          if (!isTypingFresh(row.updated_at)) {
            handlersRef.current.onTypingChange?.({
              userId: row.user_id,
              updatedAt: null,
            });
            return;
          }
          handlersRef.current.onTypingChange?.({
            userId: row.user_id,
            updatedAt: row.updated_at,
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "typing_presence",
          filter: `thread_id=eq.${thread.id}`,
        },
        (payload) => {
          const row = payload.old as RealtimeTypingRow;
          if (row.user_id === currentUserId) return;
          handlersRef.current.onTypingChange?.({
            userId: row.user_id,
            updatedAt: null,
          });
        }
      )
      .subscribe((status) => {
        setRealtimeActive(status === "SUBSCRIBED");
      });

    return () => {
      setRealtimeActive(false);
      void client.removeChannel(channel);
    };
  }, [thread, currentUserId]);

  return { realtimeActive };
}
