import type { SupabaseClient } from "@supabase/supabase-js";
import { BOOKING_STATUS_LABELS } from "@/data/booking-statuses";
import { getOrganizerCatalogSlugs } from "@/lib/organizer-bookings";
import { fetchOrganizerInbox } from "@/lib/organizer/inbox-server";
import { isGuestUserId } from "@/lib/guest-booking";
import type { Database, Json } from "@/types/database";
import type {
  NotificationCategory,
  NotificationChannel,
  NotificationPreferenceItem,
  NotificationScope,
  UnifiedNotificationItem,
} from "@/types/notifications-hub";
import {
  ORGANIZER_NOTIFICATION_CATEGORIES as ORG_CATEGORIES,
  TOURIST_NOTIFICATION_CATEGORIES as TOURIST_CATEGORIES,
  inboxCategoryToNotificationCategory as mapInboxCategory,
  unifiedInboxId as toInboxId,
} from "@/types/notifications-hub";

type DbClient = SupabaseClient<Database>;
type NotificationEventRow = Database["public"]["Tables"]["notification_events"]["Row"];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPersistableUserId(userId: string | null | undefined): userId is string {
  if (!userId?.trim()) return false;
  if (isGuestUserId(userId)) return false;
  return UUID_RE.test(userId);
}

function categoriesForScope(scope: NotificationScope): NotificationCategory[] {
  return scope === "organizer" ? ORG_CATEGORIES : TOURIST_CATEGORIES;
}

function defaultPreferences(scope: NotificationScope): NotificationPreferenceItem[] {
  const categories = categoriesForScope(scope);
  const items: NotificationPreferenceItem[] = [];
  for (const category of categories) {
    items.push({ channel: "in_app", category, enabled: true });
    items.push({ channel: "email", category, enabled: true });
  }
  return items;
}

function mergePreferences(
  scope: NotificationScope,
  rows: Pick<
    Database["public"]["Tables"]["notification_preferences"]["Row"],
    "channel" | "category" | "enabled"
  >[]
): NotificationPreferenceItem[] {
  const defaults = defaultPreferences(scope);
  const map = new Map<string, boolean>();
  for (const row of rows) {
    map.set(`${row.channel}:${row.category}`, row.enabled);
  }
  return defaults.map((item) => {
    const key = `${item.channel}:${item.category}`;
    return map.has(key) ? { ...item, enabled: map.get(key)! } : item;
  });
}

export async function fetchNotificationPreferences(
  supabase: DbClient,
  userId: string,
  scope: NotificationScope
): Promise<NotificationPreferenceItem[]> {
  const { data } = await supabase
    .from("notification_preferences")
    .select("channel, category, enabled")
    .eq("user_id", userId);

  return mergePreferences(scope, data ?? []);
}

export async function upsertNotificationPreferences(
  supabase: DbClient,
  userId: string,
  scope: NotificationScope,
  preferences: NotificationPreferenceItem[]
): Promise<NotificationPreferenceItem[]> {
  const now = new Date().toISOString();
  const allowed = new Set(
    categoriesForScope(scope).flatMap((category) => [
      `in_app:${category}`,
      `email:${category}`,
    ])
  );

  const rows = preferences
    .filter((item) => allowed.has(`${item.channel}:${item.category}`))
    .map((item) => ({
      user_id: userId,
      channel: item.channel,
      category: item.category,
      enabled: item.enabled,
      updated_at: now,
    }));

  if (rows.length > 0) {
    await supabase.from("notification_preferences").upsert(rows, {
      onConflict: "user_id,channel,category",
    });
  }

  return fetchNotificationPreferences(supabase, userId, scope);
}

async function isChannelEnabled(
  supabase: DbClient,
  userId: string,
  channel: NotificationChannel,
  category: NotificationCategory
): Promise<boolean> {
  const { data } = await supabase
    .from("notification_preferences")
    .select("enabled")
    .eq("user_id", userId)
    .eq("channel", channel)
    .eq("category", category)
    .maybeSingle();

  if (!data) return true;
  return data.enabled;
}

function rowToUnifiedItem(row: NotificationEventRow): UnifiedNotificationItem {
  return {
    id: row.id,
    source: "system",
    category: row.category as NotificationCategory,
    title: row.title,
    body: row.body,
    href: row.href ?? undefined,
    read: Boolean(row.read_at),
    createdAt: row.created_at,
  };
}

export async function fetchSystemNotifications(
  supabase: DbClient,
  userId: string,
  limit = 30
): Promise<UnifiedNotificationItem[]> {
  const { data, error } = await supabase
    .from("notification_events")
    .select("*")
    .eq("user_id", userId)
    .eq("channel", "in_app")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(rowToUnifiedItem);
}

export async function fetchUnifiedNotifications(
  supabase: DbClient,
  userId: string,
  scope: NotificationScope,
  options?: { limit?: number }
): Promise<{ items: UnifiedNotificationItem[]; unreadCount: number }> {
  const limit = options?.limit ?? 30;

  const [systemItems, preferences] = await Promise.all([
    fetchSystemNotifications(supabase, userId, limit),
    fetchNotificationPreferences(supabase, userId, scope),
  ]);

  const disabledCategories = new Set(
    preferences
      .filter((item) => item.channel === "in_app" && !item.enabled)
      .map((item) => item.category)
  );

  const filteredSystem = systemItems.filter((item) => !disabledCategories.has(item.category));

  if (scope !== "organizer") {
    const unreadCount = filteredSystem.filter((item) => !item.read).length;
    return { items: filteredSystem.slice(0, limit), unreadCount };
  }

  const slugs = getOrganizerCatalogSlugs(userId);
  const { items: inboxItems } = await fetchOrganizerInbox(supabase, userId, slugs, {
    filter: "all",
    limit: 100,
  });

  const inboxUnified: UnifiedNotificationItem[] = inboxItems
    .map((item) => ({
      id: toInboxId(item.itemKey),
      source: "inbox" as const,
      category: mapInboxCategory(item.category),
      title: item.title,
      body: item.body,
      href: item.href,
      read: Boolean(item.readAt),
      createdAt: item.createdAt,
      itemKey: item.itemKey,
    }))
    .filter((item) => !disabledCategories.has(item.category));

  const merged = [...filteredSystem, ...inboxUnified].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  const unreadCount =
    filteredSystem.filter((item) => !item.read).length +
    inboxUnified.filter((item) => !item.read).length;

  return { items: merged.slice(0, limit), unreadCount };
}

export async function markSystemNotificationRead(
  supabase: DbClient,
  userId: string,
  notificationId: string
): Promise<boolean> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("notification_events")
    .update({ read_at: now })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .eq("channel", "in_app")
    .is("read_at", null);

  return !error;
}

export async function markAllSystemNotificationsRead(
  supabase: DbClient,
  userId: string
): Promise<number> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("notification_events")
    .update({ read_at: now })
    .eq("user_id", userId)
    .eq("channel", "in_app")
    .is("read_at", null)
    .select("id");

  if (error || !data) return 0;
  return data.length;
}

export type EmitNotificationInput = {
  userId: string;
  dedupeKey: string;
  eventType: string;
  category: NotificationCategory;
  title: string;
  body: string;
  href?: string | null;
  metadata?: Json;
  channels?: NotificationChannel[];
};

export async function emitNotificationEvent(
  supabase: DbClient,
  input: EmitNotificationInput
): Promise<void> {
  if (!isPersistableUserId(input.userId)) return;

  const channels = input.channels ?? ["in_app"];
  const metadata = input.metadata ?? {};

  for (const channel of channels) {
    const enabled = await isChannelEnabled(supabase, input.userId, channel, input.category);
    if (!enabled) continue;

    const { error } = await supabase.from("notification_events").insert({
      user_id: input.userId,
      dedupe_key: input.dedupeKey,
      event_type: input.eventType,
      category: input.category,
      channel,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
      metadata,
    });

    if (error && !error.message.includes("duplicate") && error.code !== "23505") {
      console.error("[notification_events]", error.message);
    }
  }
}

export async function emitBookingStatusNotification(
  supabase: DbClient,
  input: {
    userId: string | null | undefined;
    bookingId: string;
    tourTitle: string;
    fromStatus: string | null;
    toStatus: string;
    changedAt?: string;
  }
): Promise<void> {
  if (!isPersistableUserId(input.userId)) return;

  const statusLabel = BOOKING_STATUS_LABELS[input.toStatus as keyof typeof BOOKING_STATUS_LABELS] ?? input.toStatus;
  const changedAt = input.changedAt ?? new Date().toISOString();
  const dedupeKey = `booking:status:${input.bookingId}:${input.toStatus}:${changedAt}`;

  await emitNotificationEvent(supabase, {
    userId: input.userId,
    dedupeKey,
    eventType: "booking_status_changed",
    category: "booking",
    title: "Статус заявки изменён",
    body: `«${input.tourTitle}» — ${statusLabel}`,
    href: `/profile/bookings/${encodeURIComponent(input.bookingId)}`,
    metadata: {
      booking_id: input.bookingId,
      from_status: input.fromStatus,
      to_status: input.toStatus,
    } as Json,
    channels: ["in_app"],
  });
}

export async function emitReviewApprovedNotifications(
  supabase: DbClient,
  input: {
    reviewId: string;
    tourTitle: string;
    tourSlug: string;
    authorUserId: string | null;
    organizerUserId: string | null;
    rating: number;
  }
): Promise<void> {
  const tourHref = `/tours/${encodeURIComponent(input.tourSlug)}`;
  const organizerHref = `/organizer/reviews?review=${encodeURIComponent(input.reviewId)}`;

  if (isPersistableUserId(input.authorUserId)) {
    await emitNotificationEvent(supabase, {
      userId: input.authorUserId,
      dedupeKey: `review:approved:author:${input.reviewId}`,
      eventType: "review_approved",
      category: "reviews",
      title: "Отзыв опубликован",
      body: `Ваш отзыв по туру «${input.tourTitle}» прошёл модерацию и опубликован.`,
      href: tourHref,
      metadata: { review_id: input.reviewId, tour_slug: input.tourSlug } as Json,
      channels: ["in_app", "email"],
    });
  }

  if (isPersistableUserId(input.organizerUserId)) {
    await emitNotificationEvent(supabase, {
      userId: input.organizerUserId,
      dedupeKey: `review:approved:organizer:${input.reviewId}`,
      eventType: "review_published",
      category: "reviews",
      title: "Новый опубликованный отзыв",
      body: `«${input.tourTitle}» · оценка ${input.rating}/5`,
      href: organizerHref,
      metadata: { review_id: input.reviewId, tour_slug: input.tourSlug } as Json,
      channels: ["in_app", "email"],
    });
  }
}

export async function fetchRecentDigestEvents(
  supabase: DbClient,
  sinceIso: string,
  limit = 100
): Promise<NotificationEventRow[]> {
  const { data, error } = await supabase
    .from("notification_events")
    .select("*")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data;
}

export async function fetchUserDigestEvents(
  supabase: DbClient,
  userId: string,
  sinceIso: string
): Promise<NotificationEventRow[]> {
  const { data, error } = await supabase
    .from("notification_events")
    .select("*")
    .eq("user_id", userId)
    .eq("channel", "in_app")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return data;
}

