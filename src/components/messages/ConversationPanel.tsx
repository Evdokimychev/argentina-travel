"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import {
  apiFetchConversationMessages,
  apiGetConversationByBooking,
  apiMarkConversationMessagesRead,
  apiSendConversationMessage,
  isRemoteMessagingMode,
} from "@/lib/conversations-api";
import { useConversationRealtime } from "@/hooks/useConversationRealtime";
import { useConversationTyping } from "@/hooks/useConversationTyping";
import { useMessageReadOnView } from "@/hooks/useMessageReadOnView";
import {
  createOrGetThread,
  getThreadMessages,
  sendMessage,
} from "@/lib/messages-store";
import { MESSAGES_UPDATED_EVENT, type MessageSenderRole } from "@/types/messages";
import type { Booking } from "@/types/tourist";
import type {
  ConversationMessage,
  ConversationThread,
} from "@/types/conversations";
import { cn } from "@/lib/cn";

interface ConversationPanelProps {
  booking: Booking;
  role: MessageSenderRole;
  counterpartName: string;
  className?: string;
}

function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function MessageReadStatus({
  readByCounterpartAt,
  isOwn,
}: {
  readByCounterpartAt?: string | null;
  isOwn: boolean;
}) {
  if (!isOwn) return null;

  const isRead = Boolean(readByCounterpartAt);
  const label = isRead ? "Прочитано" : "Доставлено";

  return (
    <span
      className="ml-1 inline-block text-[10px] leading-none"
      aria-label={label}
      title={label}
    >
      {isRead ? "✓✓" : "✓"}
    </span>
  );
}

export default function ConversationPanel({
  booking,
  role,
  counterpartName,
  className,
}: ConversationPanelProps) {
  const { user } = useAuth();
  const remoteMode = isRemoteMessagingMode();
  const scrollRootRef = useRef<HTMLDivElement>(null);

  const [threadId, setThreadId] = useState<string | null>(null);
  const [remoteThread, setRemoteThread] = useState<ConversationThread | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [counterpartTyping, setCounterpartTyping] = useState(false);

  const appendMessage = useCallback((message: ConversationMessage) => {
    setMessages((current) => {
      if (current.some((item) => item.id === message.id)) return current;
      return [...current, message].sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt)
      );
    });
  }, []);

  const applyReadReceipt = useCallback((messageId: string, readAt: string) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? { ...message, readByCounterpartAt: readAt }
          : message
      )
    );
  }, []);

  const handleCounterpartTyping = useCallback((typing: boolean) => {
    setCounterpartTyping(typing);
  }, []);

  const { realtimeActive } = useConversationRealtime(
    remoteThread,
    {
      onMessage: appendMessage,
      onReadReceipt: ({ messageId, readAt }) => applyReadReceipt(messageId, readAt),
      onTypingChange: ({ updatedAt }) => handleCounterpartTyping(Boolean(updatedAt)),
    },
    user?.id
  );

  useConversationTyping(
    threadId,
    draft,
    remoteMode && Boolean(threadId),
    realtimeActive,
    handleCounterpartTyping
  );

  const { setMessageElement } = useMessageReadOnView(
    threadId,
    messages,
    role,
    remoteMode && Boolean(threadId),
    scrollRootRef
  );

  const loadLocalMessages = useCallback(() => {
    if (!user) return;

    const thread = createOrGetThread({
      tourSlug: booking.tourSlug,
      touristUserId: booking.userId,
      touristName: booking.contactName,
      touristEmail: booking.contactEmail,
      bookingId: booking.id,
      organizerTourId: booking.organizerTourId,
    });

    setThreadId(thread.id);
    setRemoteThread(null);

    const localMessages = getThreadMessages(thread.id).map((message) => ({
      id: message.id,
      threadId: message.threadId,
      senderId: message.senderUserId,
      senderRole: message.senderRole,
      body: message.body,
      createdAt: message.createdAt,
    }));

    setMessages(localMessages);
  }, [booking, user]);

  const loadRemoteConversation = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const thread = await apiGetConversationByBooking(booking.id);
      setRemoteThread(thread);
      setThreadId(thread.id);

      const remoteMessages = await apiFetchConversationMessages(thread.id);
      setMessages(remoteMessages);

      const unreadIds = remoteMessages
        .filter((message) => message.senderRole !== role)
        .map((message) => message.id);

      if (unreadIds.length > 0) {
        void apiMarkConversationMessagesRead(thread.id, unreadIds).catch(() => {
          // Запасной вариант: отметка при открытии, если Realtime недоступен
        });
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Не удалось загрузить переписку"
      );
      setMessages([]);
      setThreadId(null);
      setRemoteThread(null);
    } finally {
      setLoading(false);
    }
  }, [booking.id, user, role]);

  useEffect(() => {
    if (!user) {
      setThreadId(null);
      setRemoteThread(null);
      setMessages([]);
      setCounterpartTyping(false);
      return;
    }

    if (remoteMode) {
      void loadRemoteConversation();
      return;
    }

    loadLocalMessages();

    function onLocalUpdate() {
      loadLocalMessages();
    }

    window.addEventListener(MESSAGES_UPDATED_EVENT, onLocalUpdate);
    return () => window.removeEventListener(MESSAGES_UPDATED_EVENT, onLocalUpdate);
  }, [user, remoteMode, loadLocalMessages, loadRemoteConversation]);

  const canSend = Boolean(user && threadId && draft.trim() && !sending);

  async function handleSend() {
    if (!user || !threadId) return;

    const text = draft.trim();
    if (!text) return;

    setSending(true);
    setError(null);

    if (remoteMode) {
      try {
        const message = await apiSendConversationMessage(threadId, text);
        appendMessage(message);
        setDraft("");
      } catch (sendError) {
        setError(
          sendError instanceof Error
            ? sendError.message
            : "Не удалось отправить сообщение"
        );
      } finally {
        setSending(false);
      }
      return;
    }

    const sent = sendMessage({
      threadId,
      senderRole: role,
      senderUserId: user.id,
      body: text,
    });

    setSending(false);

    if (!sent) {
      setError("Не удалось отправить сообщение");
      return;
    }

    setDraft("");
    loadLocalMessages();
  }

  const emptyHint = useMemo(() => {
    if (role === "organizer") {
      return "Напишите туристу по деталям заявки — ответ появится здесь.";
    }
    return "Задайте вопрос организатору — ответ появится в этой переписке.";
  }, [role]);

  const typingLabel = useMemo(() => {
    const name = counterpartName.trim() || "Собеседник";
    return `${name} печатает…`;
  }, [counterpartName]);

  if (!user) {
    return (
      <div
        className={cn(
          "rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-slate",
          className
        )}
      >
        Войдите в аккаунт, чтобы переписываться с {counterpartName.toLowerCase()}.
      </div>
    );
  }

  return (
    <section
      className={cn(
        "rounded-xl border border-gray-200 bg-white ring-1 ring-gray-200/60",
        className
      )}
      aria-label="Переписка по заявке"
    >
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        <MessageCircle className="h-5 w-5 shrink-0 text-brand" aria-hidden />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-charcoal">Переписка</h3>
          <p className="truncate text-xs text-slate">{counterpartName}</p>
        </div>
      </div>

      <div
        ref={scrollRootRef}
        className="flex max-h-72 min-h-40 flex-col gap-3 overflow-y-auto px-4 py-3"
      >
        {loading ? (
          <p className="text-sm text-slate">Загружаем сообщения…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-slate">{emptyHint}</p>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderRole === role;
            return (
              <div
                key={message.id}
                ref={(element) => setMessageElement(message.id, element)}
                className={cn("flex", isOwn ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                    isOwn
                      ? "bg-brand text-white"
                      : "bg-gray-100 text-charcoal"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  <p
                    className={cn(
                      "mt-1 flex items-center justify-end text-[10px]",
                      isOwn ? "text-white/80" : "text-slate"
                    )}
                  >
                    <span>{formatMessageTime(message.createdAt)}</span>
                    <MessageReadStatus
                      isOwn={isOwn}
                      readByCounterpartAt={message.readByCounterpartAt}
                    />
                  </p>
                </div>
              </div>
            );
          })
        )}

        {counterpartTyping && remoteMode ? (
          <p
            className="text-xs italic text-slate motion-safe:animate-pulse"
            role="status"
            aria-live="polite"
          >
            {typingLabel}
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="px-4 pb-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Напишите сообщение…"
            rows={2}
            className="min-h-[72px] flex-1 resize-none"
            disabled={!threadId || loading || sending}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (canSend) void handleSend();
              }
            }}
          />
          <Button
            type="button"
            size="icon"
            className="shrink-0"
            disabled={!canSend}
            loading={sending}
            loadingLabel="Отправка…"
            aria-label="Отправить сообщение"
            onClick={() => void handleSend()}
          >
            <Send className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    </section>
  );
}
