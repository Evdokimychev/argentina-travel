import { shortText } from "@/lib/notifications/email-templates";
import {
  sendBookingReminder24hEmail,
  sendConversationNewMessageEmail,
} from "@/lib/notifications/email-delivery";
import {
  emitNotificationEvent,
  isPersistableUserId,
} from "@/lib/notifications/notifications-server";
import { sendPushToUser } from "@/lib/notifications/push-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ConversationMessage, ConversationThread } from "@/types/conversations";
import type { Database } from "@/types/database";

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "first_name" | "last_name" | "email"
>;

type BookingRow = Pick<
  Database["public"]["Tables"]["bookings"]["Row"],
  "id" | "tour_title" | "tour_slug" | "contact_name" | "contact_email" | "start_date"
>;

function profileName(profile: ProfileRow | undefined, fallback: string): string {
  if (!profile) return fallback;
  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  return fullName || fallback;
}

function formatDateLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

async function hasNotificationDedupe(
  userId: string,
  dedupeKey: string
): Promise<boolean> {
  if (!isPersistableUserId(userId)) return false;
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("notification_events")
    .select("id")
    .eq("user_id", userId)
    .eq("dedupe_key", dedupeKey)
    .limit(1);
  return Boolean(data?.length);
}

export async function notifyConversationMessageCreated(input: {
  thread: ConversationThread;
  message: ConversationMessage;
}): Promise<void> {
  const senderId = input.message.senderId;
  const recipientId =
    senderId === input.thread.organizerUserId
      ? input.thread.touristUserId
      : input.thread.organizerUserId;
  const recipientRole = recipientId === input.thread.organizerUserId ? "organizer" : "tourist";
  const href =
    recipientRole === "organizer"
      ? `/organizer/messages?thread=${encodeURIComponent(input.thread.id)}`
      : `/profile/messages?thread=${encodeURIComponent(input.thread.id)}`;

  try {
    const supabase = createSupabaseAdminClient();
    const isExpertThread = Boolean(input.thread.expertInquiryId);
    const bookingId = input.thread.bookingId;

    const [{ data: booking }, expertMeta, { data: profiles }] = await Promise.all([
      bookingId
        ? supabase
            .from("bookings")
            .select("id, tour_title, tour_slug, contact_name, contact_email, start_date")
            .eq("id", bookingId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      isExpertThread
        ? supabase
            .from("expert_inquiries")
            .select("id, local_experts ( name )")
            .eq("id", input.thread.expertInquiryId!)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", [senderId, recipientId]),
    ]);

    const bookingRow = booking as BookingRow | null;
    const expertName =
      (expertMeta.data?.local_experts as { name: string } | null)?.name ?? "локальный эксперт";
    const profileById = new Map<string, ProfileRow>(
      ((profiles ?? []) as ProfileRow[]).map((row) => [row.id, row])
    );
    const senderName = profileName(profileById.get(senderId), "Собеседник");
    const recipientProfile = profileById.get(recipientId);
    const recipientName = profileName(
      recipientProfile,
      recipientRole === "organizer" ? "Организатор" : bookingRow?.contact_name?.trim() || "Турист"
    );
    const recipientEmail =
      recipientProfile?.email ??
      (recipientRole === "tourist" ? bookingRow?.contact_email ?? null : null);
    const tourTitle = bookingRow?.tour_title ?? (isExpertThread ? expertName : "Тур");
    const dedupeKey = `conversation:message:${input.message.id}:recipient:${recipientId}`;
    const notificationTitle = isExpertThread
      ? "Новое сообщение эксперту"
      : "Новое сообщение по заявке";

    await emitNotificationEvent(supabase, {
      userId: recipientId,
      dedupeKey,
      eventType: "conversation_message_new",
      category: "booking",
      title: notificationTitle,
      body: isExpertThread
        ? `${senderName}: ${shortText(input.message.body, 96)}`
        : `«${tourTitle}» · ${senderName}: ${shortText(input.message.body, 96)}`,
      href,
      metadata: {
        thread_id: input.thread.id,
        booking_id: bookingId,
        expert_inquiry_id: input.thread.expertInquiryId,
        sender_id: senderId,
      },
      channels: ["in_app"],
    });

    await Promise.allSettled([
      sendPushToUser(recipientId, {
        title: notificationTitle,
        body: `${senderName}: ${shortText(input.message.body, 90)}`,
        href,
        tag: `msg-${input.thread.id}`,
        data: {
          threadId: input.thread.id,
          bookingId: bookingId ?? undefined,
        },
      }),
      sendConversationNewMessageEmail({
        userId: recipientId,
        recipientEmail,
        recipientName,
        senderName,
        tourTitle,
        bookingId: bookingId ?? undefined,
        messageBody: input.message.body,
        messageHref: href,
      }),
    ]);
  } catch {
    // Non-blocking уведомления для чата.
  }
}

export async function notifyBookingReminder24h(input: {
  userId: string | null | undefined;
  recipientEmail: string | null;
  recipientName?: string | null;
  recipientRole: "tourist" | "organizer";
  bookingId: string;
  tourTitle: string;
  startDate: string;
}): Promise<void> {
  if (!input.userId && !input.recipientEmail) return;

  const href =
    input.recipientRole === "organizer"
      ? `/organizer/bookings/${encodeURIComponent(input.bookingId)}`
      : `/profile/bookings/${encodeURIComponent(input.bookingId)}`;
  const dedupeKey = `booking:reminder24h:${input.bookingId}:${input.recipientRole}`;

  try {
    if (isPersistableUserId(input.userId)) {
      const alreadySent = await hasNotificationDedupe(input.userId, dedupeKey);
      if (alreadySent) return;

      const supabase = createSupabaseAdminClient();
      await emitNotificationEvent(supabase, {
        userId: input.userId,
        dedupeKey,
        eventType: "booking_reminder_24h",
        category: "booking",
        title: "Напоминание о поездке",
        body: `«${input.tourTitle}» начинается ${formatDateLabel(input.startDate)}`,
        href,
        metadata: {
          booking_id: input.bookingId,
          start_date: input.startDate,
          role: input.recipientRole,
        },
        channels: ["in_app"],
      });
    }

    await Promise.allSettled([
      sendPushToUser(input.userId, {
        title: "Напоминание о поездке",
        body: `«${input.tourTitle}» начнётся уже завтра`,
        href,
        tag: `booking-reminder-${input.bookingId}-${input.recipientRole}`,
        data: {
          bookingId: input.bookingId,
          startDate: input.startDate,
        },
      }),
      sendBookingReminder24hEmail({
        userId: input.userId,
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName,
        bookingId: input.bookingId,
        tourTitle: input.tourTitle,
        startDate: input.startDate,
        detailsHref: href,
      }),
    ]);
  } catch {
    // Non-blocking уведомления напоминаний.
  }
}
