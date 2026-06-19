"use client";

import { useCallback, useEffect, useRef } from "react";
import { apiMarkConversationMessagesRead } from "@/lib/conversations-api";
import type { ConversationMessage } from "@/types/conversations";
import type { MessageSenderRole } from "@/types/messages";

export function useMessageReadOnView(
  threadId: string | null,
  messages: ConversationMessage[],
  role: MessageSenderRole,
  enabled: boolean,
  scrollRootRef: React.RefObject<HTMLElement | null>
) {
  const elementMapRef = useRef(new Map<string, HTMLElement>());
  const markedRef = useRef(new Set<string>());
  const pendingRef = useRef(new Set<string>());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushReads = useCallback(async () => {
    if (!threadId || !enabled) return;

    const ids = [...pendingRef.current].filter((id) => !markedRef.current.has(id));
    pendingRef.current.clear();
    if (ids.length === 0) return;

    try {
      await apiMarkConversationMessagesRead(threadId, ids);
      for (const id of ids) markedRef.current.add(id);
    } catch {
      for (const id of ids) pendingRef.current.add(id);
    }
  }, [threadId, enabled]);

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current) return;
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      void flushReads();
    }, 400);
  }, [flushReads]);

  const setMessageElement = useCallback((messageId: string, element: HTMLElement | null) => {
    if (element) elementMapRef.current.set(messageId, element);
    else elementMapRef.current.delete(messageId);
  }, []);

  useEffect(() => {
    markedRef.current.clear();
    pendingRef.current.clear();
    elementMapRef.current.clear();
  }, [threadId]);

  useEffect(() => {
    if (!enabled || !scrollRootRef.current) return;

    const observers: IntersectionObserver[] = [];

    for (const message of messages) {
      if (message.senderRole === role) continue;
      if (markedRef.current.has(message.id)) continue;

      const element = elementMapRef.current.get(message.id);
      if (!element) continue;

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            if (markedRef.current.has(message.id)) continue;
            pendingRef.current.add(message.id);
            scheduleFlush();
            observer.disconnect();
          }
        },
        { root: scrollRootRef.current, threshold: 0.6 }
      );

      observer.observe(element);
      observers.push(observer);
    }

    return () => {
      for (const observer of observers) observer.disconnect();
    };
  }, [messages, role, enabled, scrollRootRef, scheduleFlush]);

  useEffect(
    () => () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    },
    []
  );

  return { setMessageElement };
}
