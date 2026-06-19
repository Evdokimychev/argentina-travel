"use client";

import { useEffect, useRef } from "react";
import {
  apiFetchConversationTyping,
  apiSetConversationTyping,
} from "@/lib/conversations-api";

const TYPING_HEARTBEAT_MS = 2_500;
const TYPING_IDLE_MS = 1_500;
const TYPING_POLL_MS = 3_000;

export function useConversationTyping(
  threadId: string | null,
  draft: string,
  enabled: boolean,
  realtimeActive: boolean,
  onCounterpartTyping: (typing: boolean) => void
) {
  const lastBroadcastRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!threadId || !enabled) {
      onCounterpartTyping(false);
      return;
    }

    if (realtimeActive) return;

    let cancelled = false;

    async function poll() {
      try {
        const typing = await apiFetchConversationTyping(threadId!);
        if (cancelled) return;
        onCounterpartTyping(typing.length > 0);
      } catch {
        if (!cancelled) onCounterpartTyping(false);
      }
    }

    void poll();
    const interval = setInterval(() => void poll(), TYPING_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [threadId, enabled, realtimeActive, onCounterpartTyping]);

  useEffect(() => {
    if (!threadId || !enabled) return;

    const isTyping = draft.trim().length > 0;

    function clearTimers() {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    }

    async function broadcast(typing: boolean) {
      if (lastBroadcastRef.current === typing) return;
      lastBroadcastRef.current = typing;
      try {
        await apiSetConversationTyping(threadId!, typing);
      } catch {
        // Graceful fallback: typing is best-effort
      }
    }

    if (!isTyping) {
      clearTimers();
      void broadcast(false);
      return;
    }

    void broadcast(true);

    heartbeatRef.current = setInterval(() => {
      void apiSetConversationTyping(threadId!, true);
    }, TYPING_HEARTBEAT_MS);

    idleTimerRef.current = setTimeout(() => {
      void broadcast(false);
    }, TYPING_IDLE_MS);

    return () => {
      clearTimers();
      void broadcast(false);
    };
  }, [threadId, draft, enabled]);
}
