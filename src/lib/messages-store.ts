import { getOrganizerTourOwnerId } from "@/lib/organizer-tour-store";
import { getTourDetail } from "@/lib/tours";
import { DEFAULT_ORGANIZER_OWNER_ID } from "@/types/user";
import {
  MESSAGES_STORE_KEY,
  MESSAGES_UPDATED_EVENT,
  type MessageSenderRole,
  type MessageStoreSnapshot,
  type MessageThread,
  type ThreadMessage,
} from "@/types/messages";

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}`;
}

function readSnapshot(): MessageStoreSnapshot {
  if (typeof window === "undefined") {
    return { threads: [], messages: [] };
  }

  try {
    const raw = window.localStorage.getItem(MESSAGES_STORE_KEY);
    if (!raw) return { threads: [], messages: [] };
    const parsed = JSON.parse(raw) as MessageStoreSnapshot;
    return {
      threads: Array.isArray(parsed.threads) ? parsed.threads : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
    };
  } catch {
    return { threads: [], messages: [] };
  }
}

function writeSnapshot(snapshot: MessageStoreSnapshot) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MESSAGES_STORE_KEY, JSON.stringify(snapshot));
}

function notifyUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(MESSAGES_UPDATED_EVENT));
  }
}

function resolveOrganizerForTour(tourSlug: string, organizerTourId?: string): {
  organizerUserId: string;
  organizerName: string;
  tourTitle: string;
} {
  const tour = getTourDetail(tourSlug);
  const ownerId =
    (organizerTourId ? getOrganizerTourOwnerId(organizerTourId) : undefined) ??
    tour?.organizer.ownerUserId ??
    tour?.organizer.slug ??
    DEFAULT_ORGANIZER_OWNER_ID;

  return {
    organizerUserId: ownerId,
    organizerName: tour?.organizer.name ?? "Организатор",
    tourTitle: tour?.title ?? tourSlug,
  };
}

function threadMatchesParticipant(
  thread: MessageThread,
  input: { userId: string; role: MessageSenderRole }
): boolean {
  return input.role === "organizer"
    ? thread.organizerUserId === input.userId
    : thread.touristUserId === input.userId;
}

export function getThreadById(threadId: string): MessageThread | undefined {
  return readSnapshot().threads.find((thread) => thread.id === threadId);
}

export function getThreadsForTourist(userId: string): MessageThread[] {
  return readSnapshot()
    .threads.filter((thread) => thread.touristUserId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getThreadsForOrganizer(userId: string): MessageThread[] {
  return readSnapshot()
    .threads.filter((thread) => thread.organizerUserId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getThreadMessages(threadId: string): ThreadMessage[] {
  return readSnapshot()
    .messages.filter((message) => message.threadId === threadId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getUnreadMessagesCount(input: {
  userId: string;
  role: MessageSenderRole;
}): number {
  const snapshot = readSnapshot();
  return snapshot.threads
    .filter((thread) => threadMatchesParticipant(thread, input))
    .reduce(
      (sum, thread) =>
        sum +
        (input.role === "organizer" ? thread.organizerUnread : thread.touristUnread),
      0
    );
}

export function findThreadByBookingId(bookingId: string): MessageThread | undefined {
  return readSnapshot().threads.find((thread) => thread.bookingId === bookingId);
}

export function findThread(input: {
  tourSlug: string;
  touristUserId: string;
  bookingId?: string;
}): MessageThread | undefined {
  const snapshot = readSnapshot();
  return snapshot.threads.find((thread) => {
    if (thread.tourSlug !== input.tourSlug) return false;
    if (thread.touristUserId !== input.touristUserId) return false;
    if (input.bookingId) return thread.bookingId === input.bookingId;
    return !thread.bookingId;
  });
}

export function createOrGetThread(input: {
  tourSlug: string;
  touristUserId: string;
  touristName: string;
  touristEmail?: string;
  bookingId?: string;
  organizerTourId?: string;
  subject?: string;
  initialMessage?: string;
}): MessageThread {
  const existing = findThread({
    tourSlug: input.tourSlug,
    touristUserId: input.touristUserId,
    bookingId: input.bookingId,
  });
  if (existing) {
    if (input.initialMessage?.trim()) {
      sendMessage({
        threadId: existing.id,
        senderRole: "tourist",
        senderUserId: input.touristUserId,
        body: input.initialMessage.trim(),
      });
      return getThreadById(existing.id)!;
    }
    return existing;
  }

  const organizer = resolveOrganizerForTour(input.tourSlug, input.organizerTourId);
  const now = new Date().toISOString();
  const thread: MessageThread = {
    id: createId("thread"),
    tourSlug: input.tourSlug,
    tourTitle: organizer.tourTitle,
    bookingId: input.bookingId,
    organizerUserId: organizer.organizerUserId,
    organizerName: organizer.organizerName,
    touristUserId: input.touristUserId,
    touristName: input.touristName,
    touristEmail: input.touristEmail?.trim().toLowerCase(),
    subject: input.subject?.trim(),
    createdAt: now,
    updatedAt: now,
    lastMessagePreview: "",
    organizerUnread: 0,
    touristUnread: 0,
  };

  const snapshot = readSnapshot();
  snapshot.threads.unshift(thread);
  writeSnapshot(snapshot);
  notifyUpdated();

  if (input.initialMessage?.trim()) {
    sendMessage({
      threadId: thread.id,
      senderRole: "tourist",
      senderUserId: input.touristUserId,
      body: input.initialMessage.trim(),
    });
    return getThreadById(thread.id)!;
  }

  return thread;
}

export function sendMessage(input: {
  threadId: string;
  senderRole: MessageSenderRole;
  senderUserId: string;
  body: string;
}): ThreadMessage | null {
  const text = input.body.trim();
  if (!text) return null;

  const snapshot = readSnapshot();
  const threadIndex = snapshot.threads.findIndex((item) => item.id === input.threadId);
  if (threadIndex === -1) return null;

  const thread = snapshot.threads[threadIndex];
  if (!threadMatchesParticipant(thread, { userId: input.senderUserId, role: input.senderRole })) {
    return null;
  }

  const now = new Date().toISOString();
  const message: ThreadMessage = {
    id: createId("msg"),
    threadId: input.threadId,
    senderRole: input.senderRole,
    senderUserId: input.senderUserId,
    body: text,
    createdAt: now,
    read: false,
  };

  snapshot.messages.push(message);
  snapshot.threads[threadIndex] = {
    ...thread,
    updatedAt: now,
    lastMessagePreview: text.slice(0, 140),
    organizerUnread:
      input.senderRole === "tourist" ? thread.organizerUnread + 1 : 0,
    touristUnread:
      input.senderRole === "organizer" ? thread.touristUnread + 1 : 0,
  };

  writeSnapshot(snapshot);
  notifyUpdated();
  return message;
}

export function markThreadRead(input: {
  threadId: string;
  readerRole: MessageSenderRole;
  readerUserId: string;
}): void {
  const snapshot = readSnapshot();
  const threadIndex = snapshot.threads.findIndex((item) => item.id === input.threadId);
  if (threadIndex === -1) return;

  const thread = snapshot.threads[threadIndex];
  if (!threadMatchesParticipant(thread, { userId: input.readerUserId, role: input.readerRole })) {
    return;
  }

  const unreadField =
    input.readerRole === "organizer" ? "organizerUnread" : "touristUnread";
  if (thread[unreadField] === 0) return;

  snapshot.threads[threadIndex] = { ...thread, [unreadField]: 0 };
  snapshot.messages = snapshot.messages.map((message) => {
    if (message.threadId !== input.threadId) return message;
    if (message.senderRole === input.readerRole) return message;
    return { ...message, read: true };
  });

  writeSnapshot(snapshot);
  notifyUpdated();
}

export function buildTouristThreadHref(threadId: string): string {
  return `/profile/messages?thread=${threadId}`;
}

export function buildOrganizerThreadHref(threadId: string): string {
  return `/organizer/messages?thread=${threadId}`;
}

export function buildTourMessageHref(tourSlug: string, bookingId?: string): string {
  if (bookingId) {
    const existing = findThreadByBookingId(bookingId);
    if (existing) return buildTouristThreadHref(existing.id);
  }
  const params = new URLSearchParams({ new: "1", tour: tourSlug });
  if (bookingId) params.set("booking", bookingId);
  return `/profile/messages?${params.toString()}`;
}

export function buildOrganizerBookingMessageHref(bookingId: string): string {
  const existing = findThreadByBookingId(bookingId);
  if (existing) return buildOrganizerThreadHref(existing.id);
  return "/organizer/messages";
}
