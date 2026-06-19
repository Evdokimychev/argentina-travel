import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Booking } from "@/types/tourist";
import type { SessionUser } from "@/types/user";
import type { MessageSenderRole, MessageThread } from "@/types/messages";
import { bookingMatchesContactEmail } from "@/lib/guest-booking";
import {
  canAccessBooking,
  fetchBookingById,
  organizerCanAccessBooking,
} from "@/lib/bookings-server";
import { getOrganizerTourOwnerId } from "@/lib/organizer-tour-store";
import { getOrganizerCatalogSlugs } from "@/lib/organizer-bookings";
import { TYPING_PRESENCE_TTL_SECONDS } from "@/lib/messaging/constants";
import type {
  ConversationMessage,
  ConversationThread,
  ConversationTypingState,
} from "@/types/conversations";

type DbClient = SupabaseClient<Database>;

type ConversationThreadRow = Database["public"]["Tables"]["conversation_threads"]["Row"];
type ConversationMessageRow = Database["public"]["Tables"]["conversation_messages"]["Row"];
type MessageReadRow = Database["public"]["Tables"]["message_reads"]["Row"];
type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "first_name" | "last_name" | "email"
>;
type BookingMetaRow = Pick<
  Database["public"]["Tables"]["bookings"]["Row"],
  "id" | "tour_slug" | "tour_title" | "contact_name" | "contact_email"
>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

function rowToThread(row: ConversationThreadRow): ConversationThread {
  return {
    id: row.id,
    bookingId: row.booking_id,
    touristUserId: row.tourist_user_id,
    organizerUserId: row.organizer_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function resolveSenderRole(
  thread: ConversationThread,
  senderId: string
): ConversationMessage["senderRole"] {
  if (senderId === thread.touristUserId) return "tourist";
  if (senderId === thread.organizerUserId) return "organizer";
  return "tourist";
}

function rowToMessage(
  thread: ConversationThread,
  row: ConversationMessageRow,
  readByCounterpartAt?: string | null
): ConversationMessage {
  return {
    id: row.id,
    threadId: row.thread_id,
    senderId: row.sender_id,
    senderRole: resolveSenderRole(thread, row.sender_id),
    body: row.body,
    createdAt: row.created_at,
    readByCounterpartAt,
  };
}

export function getCounterpartUserId(
  thread: ConversationThread,
  userId: string
): string | null {
  if (userId === thread.touristUserId) return thread.organizerUserId;
  if (userId === thread.organizerUserId) return thread.touristUserId;
  return null;
}

export { TYPING_PRESENCE_TTL_SECONDS } from "@/lib/messaging/constants";

export function resolveOrganizerUserIdForBooking(
  booking: Booking,
  bookingRowOrganizerId?: string | null
): string | null {
  if (bookingRowOrganizerId?.trim() && isUuid(bookingRowOrganizerId)) {
    return bookingRowOrganizerId.trim();
  }

  if (booking.organizerTourId) {
    const ownerId = getOrganizerTourOwnerId(booking.organizerTourId);
    if (ownerId && isUuid(ownerId)) return ownerId;
  }

  return null;
}

export function resolveTouristUserIdForBooking(
  booking: Booking,
  actor: SessionUser,
  profileEmail?: string | null
): string | null {
  if (booking.userId === actor.id && isUuid(actor.id)) {
    return actor.id;
  }

  const email = profileEmail ?? actor.email;
  if (email && bookingMatchesContactEmail(booking, email) && isUuid(actor.id)) {
    return actor.id;
  }

  return null;
}

export function canAccessConversationThread(
  thread: ConversationThread,
  actor: SessionUser | null
): boolean {
  if (!actor) return false;
  return (
    thread.touristUserId === actor.id || thread.organizerUserId === actor.id
  );
}

export async function fetchConversationThreadById(
  supabase: DbClient,
  threadId: string
): Promise<ConversationThread | null> {
  const { data, error } = await supabase
    .from("conversation_threads")
    .select("*")
    .eq("id", threadId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToThread(data);
}

export async function fetchConversationThreadByBookingId(
  supabase: DbClient,
  bookingId: string
): Promise<ConversationThread | null> {
  const { data, error } = await supabase
    .from("conversation_threads")
    .select("*")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToThread(data);
}

export async function getOrCreateConversationThreadForBooking(
  supabase: DbClient,
  bookingId: string,
  actor: SessionUser,
  profileEmail?: string | null
): Promise<{ thread: ConversationThread } | { error: string }> {
  const booking = await fetchBookingById(supabase, bookingId);
  if (!booking) {
    return { error: "Заявка не найдена" };
  }

  if (!canAccessBooking(booking, actor, profileEmail)) {
    return { error: "Нет доступа к переписке" };
  }

  const existing = await fetchConversationThreadByBookingId(supabase, bookingId);
  if (existing) {
    if (!canAccessConversationThread(existing, actor)) {
      return { error: "Нет доступа к переписке" };
    }
    return { thread: existing };
  }

  const { data: bookingRow } = await supabase
    .from("bookings")
    .select("organizer_user_id")
    .eq("id", bookingId)
    .maybeSingle();

  const organizerUserId = resolveOrganizerUserIdForBooking(
    booking,
    bookingRow?.organizer_user_id
  );

  if (!organizerUserId) {
    return { error: "Организатор тура не привязан к аккаунту" };
  }

  let touristUserId = resolveTouristUserIdForBooking(booking, actor, profileEmail);

  const isOrganizerParticipant =
    organizerCanAccessBooking(booking, actor.id, getOrganizerCatalogSlugs(actor.id)) ||
    actor.id === organizerUserId;

  if (!touristUserId && isOrganizerParticipant) {
    if (booking.userId && isUuid(booking.userId)) {
      touristUserId = booking.userId;
    } else {
      return { error: "Турист ещё не привязан к аккаунту" };
    }
  }

  if (!touristUserId) {
    return { error: "Войдите под аккаунтом туриста для переписки" };
  }

  if (touristUserId === organizerUserId) {
    return { error: "Нельзя создать переписку с самим собой" };
  }

  const { data, error } = await supabase
    .from("conversation_threads")
    .insert({
      booking_id: bookingId,
      tourist_user_id: touristUserId,
      organizer_user_id: organizerUserId,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      const raced = await fetchConversationThreadByBookingId(supabase, bookingId);
      if (raced) return { thread: raced };
    }
    return { error: error.message };
  }

  return { thread: rowToThread(data) };
}

export async function fetchConversationMessages(
  supabase: DbClient,
  thread: ConversationThread,
  viewerId?: string | null
): Promise<ConversationMessage[]> {
  const { data, error } = await supabase
    .from("conversation_messages")
    .select("*")
    .eq("thread_id", thread.id)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  const readByCounterpart = new Map<string, string>();
  if (viewerId) {
    const counterpartId = getCounterpartUserId(thread, viewerId);
    const ownMessageIds = data
      .filter((row) => row.sender_id === viewerId)
      .map((row) => row.id);

    if (counterpartId && ownMessageIds.length > 0) {
      const { data: reads } = await supabase
        .from("message_reads")
        .select("message_id, read_at")
        .eq("user_id", counterpartId)
        .in("message_id", ownMessageIds);

      for (const read of reads ?? []) {
        readByCounterpart.set(read.message_id, read.read_at);
      }
    }
  }

  return data.map((row) =>
    rowToMessage(
      thread,
      row,
      viewerId && row.sender_id === viewerId
        ? readByCounterpart.get(row.id) ?? null
        : undefined
    )
  );
}

function formatProfileName(profile: ProfileRow | undefined, fallback: string): string {
  if (!profile) return fallback;
  const firstName = profile.first_name.trim();
  const lastName = profile.last_name.trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName || fallback;
}

async function fetchUnreadByThread(
  supabase: DbClient,
  userId: string,
  threadIds: string[]
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (threadIds.length === 0) return result;

  const { data: incomingMessages, error: incomingError } = await supabase
    .from("conversation_messages")
    .select("id, thread_id")
    .in("thread_id", threadIds)
    .neq("sender_id", userId);

  if (incomingError || !incomingMessages?.length) {
    return result;
  }

  const messageIds = incomingMessages.map((message) => message.id);
  const { data: reads, error: readsError } = await supabase
    .from("message_reads")
    .select("message_id")
    .eq("user_id", userId)
    .in("message_id", messageIds);

  if (readsError) {
    return result;
  }

  const readSet = new Set((reads ?? []).map((row) => row.message_id));
  for (const message of incomingMessages) {
    if (readSet.has(message.id)) continue;
    result.set(message.thread_id, (result.get(message.thread_id) ?? 0) + 1);
  }

  return result;
}

export async function countConversationUnreadMessages(
  supabase: DbClient,
  userId: string,
  role: MessageSenderRole
): Promise<number> {
  const participantColumn = role === "organizer" ? "organizer_user_id" : "tourist_user_id";
  const { data: threadRows, error } = await supabase
    .from("conversation_threads")
    .select("id")
    .eq(participantColumn, userId);

  if (error || !threadRows?.length) return 0;

  const unreadByThread = await fetchUnreadByThread(
    supabase,
    userId,
    threadRows.map((thread) => thread.id)
  );

  return [...unreadByThread.values()].reduce((sum, count) => sum + count, 0);
}

export async function fetchConversationInboxSummary(
  supabase: DbClient,
  userId: string,
  role: MessageSenderRole,
  options?: { limit?: number }
): Promise<{ threads: MessageThread[]; unreadCount: number }> {
  const limit = options?.limit ?? 50;
  const participantColumn = role === "organizer" ? "organizer_user_id" : "tourist_user_id";

  const { data: threadRows, error: threadsError } = await supabase
    .from("conversation_threads")
    .select("*")
    .eq(participantColumn, userId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (threadsError || !threadRows?.length) {
    return { threads: [], unreadCount: 0 };
  }

  const threadIds = threadRows.map((thread) => thread.id);
  const bookingIds = [...new Set(threadRows.map((thread) => thread.booking_id))];
  const participantIds = [
    ...new Set(
      threadRows.flatMap((thread) => [thread.tourist_user_id, thread.organizer_user_id])
    ),
  ];

  const [bookingsResult, profilesResult, latestMessagesResult, unreadByThread, unreadCount] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("id, tour_slug, tour_title, contact_name, contact_email")
        .in("id", bookingIds),
      supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", participantIds),
      supabase
        .from("conversation_messages")
        .select("thread_id, body, created_at")
        .in("thread_id", threadIds)
        .order("created_at", { ascending: false }),
      fetchUnreadByThread(supabase, userId, threadIds),
      countConversationUnreadMessages(supabase, userId, role),
    ]);

  const bookingById = new Map<string, BookingMetaRow>(
    (bookingsResult.data ?? []).map((booking) => [booking.id, booking])
  );
  const profileById = new Map<string, ProfileRow>(
    (profilesResult.data ?? []).map((profile) => [profile.id, profile])
  );

  const latestMessageByThread = new Map<
    string,
    Pick<ConversationMessageRow, "thread_id" | "body" | "created_at">
  >();
  for (const message of latestMessagesResult.data ?? []) {
    if (!latestMessageByThread.has(message.thread_id)) {
      latestMessageByThread.set(message.thread_id, message);
    }
  }

  const threads: MessageThread[] = threadRows.map((thread) => {
    const booking = bookingById.get(thread.booking_id);
    const organizerProfile = profileById.get(thread.organizer_user_id);
    const touristProfile = profileById.get(thread.tourist_user_id);
    const latestMessage = latestMessageByThread.get(thread.id);
    const unreadForCurrentUser = unreadByThread.get(thread.id) ?? 0;

    return {
      id: thread.id,
      bookingId: thread.booking_id,
      tourSlug: booking?.tour_slug ?? "",
      tourTitle: booking?.tour_title ?? "Тур",
      organizerUserId: thread.organizer_user_id,
      organizerName: formatProfileName(organizerProfile, "Организатор"),
      touristUserId: thread.tourist_user_id,
      touristName: formatProfileName(
        touristProfile,
        booking?.contact_name?.trim() || "Турист"
      ),
      touristEmail: booking?.contact_email ?? touristProfile?.email ?? undefined,
      createdAt: thread.created_at,
      updatedAt: thread.updated_at,
      lastMessagePreview: latestMessage?.body?.trim().slice(0, 140) ?? "",
      organizerUnread: role === "organizer" ? unreadForCurrentUser : 0,
      touristUnread: role === "tourist" ? unreadForCurrentUser : 0,
    };
  });

  return { threads, unreadCount };
}

export async function insertConversationMessage(
  supabase: DbClient,
  thread: ConversationThread,
  senderId: string,
  body: string
): Promise<{ message: ConversationMessage } | { error: string }> {
  const text = body.trim();
  if (!text) {
    return { error: "Введите текст сообщения" };
  }
  if (text.length > 4000) {
    return { error: "Сообщение слишком длинное" };
  }

  if (
    senderId !== thread.touristUserId &&
    senderId !== thread.organizerUserId
  ) {
    return { error: "Нет доступа к переписке" };
  }

  const { data, error } = await supabase
    .from("conversation_messages")
    .insert({
      thread_id: thread.id,
      sender_id: senderId,
      body: text,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось отправить сообщение" };
  }

  return { message: rowToMessage(thread, data) };
}

export async function markConversationMessagesRead(
  supabase: DbClient,
  thread: ConversationThread,
  readerId: string,
  messageIds: string[]
): Promise<{ marked: number } | { error: string }> {
  const uniqueIds = [...new Set(messageIds.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) {
    return { marked: 0 };
  }

  const { data: eligible, error: fetchError } = await supabase
    .from("conversation_messages")
    .select("id")
    .eq("thread_id", thread.id)
    .in("id", uniqueIds)
    .neq("sender_id", readerId);

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!eligible?.length) {
    return { marked: 0 };
  }

  const now = new Date().toISOString();
  const rows: MessageReadRow[] = eligible.map((message) => ({
    user_id: readerId,
    message_id: message.id,
    read_at: now,
  }));

  const { error } = await supabase
    .from("message_reads")
    .upsert(rows, { onConflict: "user_id,message_id" });

  if (error) {
    return { error: error.message };
  }

  return { marked: rows.length };
}

export async function setTypingPresence(
  supabase: DbClient,
  threadId: string,
  userId: string,
  typing: boolean
): Promise<{ ok: true } | { error: string }> {
  if (!typing) {
    const { error } = await supabase
      .from("typing_presence")
      .delete()
      .eq("thread_id", threadId)
      .eq("user_id", userId);

    if (error) {
      return { error: error.message };
    }
    return { ok: true };
  }

  const { error } = await supabase.from("typing_presence").upsert(
    {
      thread_id: threadId,
      user_id: userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "thread_id,user_id" }
  );

  if (error) {
    return { error: error.message };
  }

  return { ok: true };
}

export async function fetchActiveTypingUsers(
  supabase: DbClient,
  threadId: string,
  excludeUserId?: string | null,
  ttlSeconds: number = TYPING_PRESENCE_TTL_SECONDS
): Promise<ConversationTypingState[]> {
  const cutoff = new Date(Date.now() - ttlSeconds * 1000).toISOString();

  const { data, error } = await supabase
    .from("typing_presence")
    .select("user_id, updated_at")
    .eq("thread_id", threadId)
    .gte("updated_at", cutoff);

  if (error || !data) return [];

  return data
    .filter((row) => row.user_id !== excludeUserId)
    .map((row) => ({
      userId: row.user_id,
      updatedAt: row.updated_at,
    }));
}

export async function assertThreadAccess(
  supabase: DbClient,
  threadId: string,
  actor: SessionUser | null
): Promise<{ thread: ConversationThread } | { error: string; status: number }> {
  if (!actor) {
    return { error: "Войдите в аккаунт", status: 401 };
  }

  const thread = await fetchConversationThreadById(supabase, threadId);
  if (!thread) {
    return { error: "Переписка не найдена", status: 404 };
  }

  if (!canAccessConversationThread(thread, actor)) {
    return { error: "Нет доступа", status: 403 };
  }

  return { thread };
}
