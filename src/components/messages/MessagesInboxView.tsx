"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/context/AuthContext";
import { getUserBookings } from "@/lib/bookings-store";
import { apiFetchUserBookings, isRemoteBookingsMode } from "@/lib/bookings-api";
import { formatBookingTourDates } from "@/lib/booking-display";
import { getTourDetail } from "@/lib/tours";
import {
  createOrGetThread,
  getThreadMessages,
  getThreadsForOrganizer,
  getThreadsForTourist,
  markThreadRead,
  sendMessage,
} from "@/lib/messages-store";
import { MESSAGES_UPDATED_EVENT, type MessageSenderRole, type MessageThread } from "@/types/messages";
import type { Booking } from "@/types/tourist";
import { cn } from "@/lib/cn";
import { cabinetCardClass, cabinetLinkClass, cabinetPanelClass } from "@/lib/cabinet-ui";

interface MessagesInboxViewProps {
  role: MessageSenderRole;
  basePath: "/profile/messages" | "/organizer/messages";
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

function ThreadListItem({
  thread,
  role,
  active,
  onSelect,
}: {
  thread: MessageThread;
  role: MessageSenderRole;
  active: boolean;
  onSelect: () => void;
}) {
  const unread = role === "organizer" ? thread.organizerUnread : thread.touristUnread;
  const counterpart =
    role === "organizer" ? thread.touristName : thread.organizerName;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl border px-3 py-3 text-left transition-colors",
        active
          ? "border-sky/30 bg-sky/5"
          : "border-gray-100 bg-white hover:border-sky/20"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-charcoal">{counterpart}</p>
          <p className="truncate text-xs text-slate">{thread.tourTitle}</p>
        </div>
        {unread > 0 ? (
          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-sky px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        ) : null}
      </div>
      {thread.lastMessagePreview ? (
        <p className="mt-2 line-clamp-2 text-xs text-slate">{thread.lastMessagePreview}</p>
      ) : null}
      <p className="mt-1 text-[11px] text-slate">{formatMessageTime(thread.updatedAt)}</p>
    </button>
  );
}

export default function MessagesInboxView({ role, basePath }: MessagesInboxViewProps) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [composeError, setComposeError] = useState<string | null>(null);
  const [newTourSlug, setNewTourSlug] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");

  const isNewCompose = searchParams.get("new") === "1";
  const presetTourSlug = searchParams.get("tour")?.trim() ?? "";
  const presetBookingId = searchParams.get("booking")?.trim();
  const presetThreadId = searchParams.get("thread")?.trim();

  function refreshThreads() {
    if (!user) return;
    const list =
      role === "organizer"
        ? getThreadsForOrganizer(user.id)
        : getThreadsForTourist(user.id);
    setThreads(list);
  }

  useEffect(() => {
    refreshThreads();
    window.addEventListener(MESSAGES_UPDATED_EVENT, refreshThreads);
    return () => window.removeEventListener(MESSAGES_UPDATED_EVENT, refreshThreads);
  }, [user, role]);

  useEffect(() => {
    if (presetThreadId) {
      setActiveThreadId(presetThreadId);
      return;
    }
    if (!activeThreadId && threads.length > 0) {
      setActiveThreadId(threads[0].id);
    }
  }, [presetThreadId, threads, activeThreadId]);

  useEffect(() => {
    if (presetTourSlug) setNewTourSlug(presetTourSlug);
  }, [presetTourSlug]);

  useEffect(() => {
    if (presetBookingId) setSelectedBookingId(presetBookingId);
  }, [presetBookingId]);

  useEffect(() => {
    if (!user || role !== "tourist") return;

    function refreshBookings() {
      if (isRemoteBookingsMode()) {
        void apiFetchUserBookings()
          .then(setBookings)
          .catch(() => setBookings([]));
        return;
      }
      setBookings(getUserBookings(user!.id));
    }

    refreshBookings();
  }, [user, role]);

  useEffect(() => {
    if (!selectedBookingId) return;
    const booking = bookings.find((item) => item.id === selectedBookingId);
    if (booking) setNewTourSlug(booking.tourSlug);
  }, [selectedBookingId, bookings]);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [threads, activeThreadId]
  );

  const messages = activeThread ? getThreadMessages(activeThread.id) : [];

  useEffect(() => {
    if (!user || !activeThread) return;
    markThreadRead({
      threadId: activeThread.id,
      readerRole: role,
      readerUserId: user.id,
    });
  }, [activeThread?.id, user, role]);

  function handleSend() {
    if (!user || !activeThread) return;
    const sent = sendMessage({
      threadId: activeThread.id,
      senderRole: role,
      senderUserId: user.id,
      body: draft,
    });
    if (!sent) return;
    setDraft("");
    refreshThreads();
  }

  function handleStartThread() {
    if (!user) return;
    const slug = newTourSlug.trim();
    const body = newMessage.trim();
    if (!slug) {
      setComposeError("Выберите бронирование или откройте диалог со страницы тура");
      return;
    }
    if (!body) {
      setComposeError("Напишите сообщение организатору");
      return;
    }

    const thread = createOrGetThread({
      tourSlug: slug,
      touristUserId: user.id,
      touristName: user.fullName,
      touristEmail: user.email,
      bookingId: selectedBookingId || presetBookingId,
      initialMessage: body,
    });

    setComposeError(null);
    setNewMessage("");
    refreshThreads();
    setActiveThreadId(thread.id);
    router.replace(`${basePath}?thread=${thread.id}`);
  }

  const presetTour = presetTourSlug ? getTourDetail(presetTourSlug) : null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-charcoal sm:text-3xl">Сообщения</h1>
        <p className="mt-1 text-sm text-slate">
          {role === "organizer"
            ? "Переписка с туристами по турам и заявкам"
            : "Вопросы организаторам по турам и бронированиям"}
        </p>
      </div>

      {isNewCompose && role === "tourist" ? (
        <div className={cabinetPanelClass}>
          <h2 className="font-heading text-base font-bold text-charcoal">Новое сообщение</h2>
          {presetTour ? (
            <p className="mt-2 text-sm text-slate">
              Тур:{" "}
              <Link href={`/tours/${presetTour.slug}`} className={cabinetLinkClass}>
                {presetTour.title}
              </Link>
            </p>
          ) : bookings.length > 0 ? (
            <label className="mt-3 block text-sm text-slate">
              Ваше бронирование
              <select
                value={selectedBookingId}
                onChange={(event) => setSelectedBookingId(event.target.value)}
                className="mt-1 flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-charcoal"
              >
                <option value="">Выберите заявку</option>
                {bookings.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {booking.tourTitle} ·{" "}
                    {formatBookingTourDates(booking, "даты по согласованию")}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="mt-3 text-sm text-slate">
              Бронирований пока нет.{" "}
              <Link href="/tours" className={cabinetLinkClass}>
                Выберите тур
              </Link>{" "}
              или{" "}
              <Link href="/booking/find" className={cabinetLinkClass}>
                найдите заявку по email
              </Link>
              .
            </p>
          )}
          <label className="mt-3 block text-sm text-slate">
            Сообщение
            <Textarea
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              rows={4}
              className="mt-1"
              placeholder="Здравствуйте! Хотел(а) уточнить..."
            />
          </label>
          {composeError ? (
            <p className="mt-2 text-sm text-red-600">{composeError}</p>
          ) : null}
          <Button type="button" className="mt-4" onClick={handleStartThread}>
            Отправить
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-2">
          {threads.length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              title="Пока нет переписки"
              description={
                role === "tourist"
                  ? "Нажмите «Задать вопрос» на странице тура."
                  : "Когда турист напишет вам, переписка появится здесь."
              }
              bordered
              className="px-4"
            />
          ) : (
            threads.map((thread) => (
              <ThreadListItem
                key={thread.id}
                thread={thread}
                role={role}
                active={thread.id === activeThreadId}
                onSelect={() => {
                  setActiveThreadId(thread.id);
                  router.replace(`${basePath}?thread=${thread.id}`, { scroll: false });
                }}
              />
            ))
          )}
        </div>

        <div className={cn(cabinetCardClass, "flex min-h-[420px] flex-col overflow-hidden")}>
          {activeThread ? (
            <>
              <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
                <p className="font-semibold text-charcoal">
                  {role === "organizer" ? activeThread.touristName : activeThread.organizerName}
                </p>
                <p className="mt-1 text-sm text-slate">
                  <Link href={`/tours/${activeThread.tourSlug}`} className={cabinetLinkClass}>
                    {activeThread.tourTitle}
                  </Link>
                  {activeThread.bookingId ? (
                    <span className="ml-2 text-xs text-slate">
                      · заявка {activeThread.bookingId}
                    </span>
                  ) : null}
                </p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-24 sm:px-5 sm:pb-5">
                {messages.map((message) => {
                  const own = message.senderRole === role;
                  return (
                    <div
                      key={message.id}
                      className={cn("flex", own ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                          own ? "bg-brand text-white" : "bg-gray-100 text-charcoal"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.body}</p>
                        <p
                          className={cn(
                            "mt-1 text-[10px]",
                            own ? "text-white/70" : "text-slate"
                          )}
                        >
                          {formatMessageTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="sticky bottom-0 border-t border-gray-100 bg-white/95 p-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] backdrop-blur-md sm:p-5 sm:pb-5">
                <div className="flex gap-2">
                  <Textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={2}
                    placeholder="Напишите ответ..."
                    className="min-h-[44px] flex-1 resize-none"
                  />
                  <Button
                    type="button"
                    className="shrink-0 self-end"
                    onClick={handleSend}
                    disabled={!draft.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-slate">
              Выберите диалог слева
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
