import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Booking } from "@/types/tourist";
import type { SessionUser } from "@/types/user";
import { bookingMatchesContactEmail } from "@/lib/guest-booking";
import {
  canAccessBooking,
  fetchBookingById,
  organizerCanAccessBooking,
} from "@/lib/bookings-server";
import { getOrganizerTourOwnerId } from "@/lib/organizer-tour-store";
import { getOrganizerCatalogSlugs } from "@/lib/organizer-bookings";
import type {
  ConversationMessage,
  ConversationThread,
} from "@/types/conversations";

type DbClient = SupabaseClient<Database>;

type ConversationThreadRow = Database["public"]["Tables"]["conversation_threads"]["Row"];
type ConversationMessageRow = Database["public"]["Tables"]["conversation_messages"]["Row"];

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
  row: ConversationMessageRow
): ConversationMessage {
  return {
    id: row.id,
    threadId: row.thread_id,
    senderId: row.sender_id,
    senderRole: resolveSenderRole(thread, row.sender_id),
    body: row.body,
    createdAt: row.created_at,
  };
}

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
  thread: ConversationThread
): Promise<ConversationMessage[]> {
  const { data, error } = await supabase
    .from("conversation_messages")
    .select("*")
    .eq("thread_id", thread.id)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => rowToMessage(thread, row));
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
