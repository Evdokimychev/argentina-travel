import type { SupabaseClient } from "@supabase/supabase-js";
import { BOOKING_PAYMENT_STATUS_LABELS } from "@/lib/booking-params";
import { BOOKING_STATUS_LABELS } from "@/data/booking-statuses";
import { fetchOrganizerPublishedReviews } from "@/lib/reviews-server";
import type { Database } from "@/types/database";
import type {
  OrganizerInboxCategory,
  OrganizerInboxFilter,
  OrganizerInboxItem,
  OrganizerInboxItemType,
} from "@/types/organizer-inbox";
import type { BookingPaymentStatus } from "@/types/booking-params";
import type { Booking } from "@/types/tourist";
import type { TouristReview } from "@/types/tourist";

type DbClient = SupabaseClient<Database>;

const RECENT_MS = 30 * 24 * 60 * 60 * 1000;
const NEW_REVIEW_MS = 14 * 24 * 60 * 60 * 1000;

type DraftItem = Omit<OrganizerInboxItem, "readAt">;

function paymentStatusLabel(status: string | null | undefined): string {
  if (!status) return BOOKING_PAYMENT_STATUS_LABELS.pending;
  const normalized = status as BookingPaymentStatus;
  return BOOKING_PAYMENT_STATUS_LABELS[normalized] ?? status;
}

async function fetchReadMap(
  supabase: DbClient,
  organizerUserId: string
): Promise<Map<string, string>> {
  const { data } = await supabase
    .from("organizer_inbox_reads")
    .select("item_key, read_at")
    .eq("user_id", organizerUserId);

  const map = new Map<string, string>();
  for (const row of data ?? []) {
    map.set(row.item_key, row.read_at);
  }
  return map;
}

function buildBookingItems(booking: Booking, now: number): DraftItem[] {
  const items: DraftItem[] = [];
  const bookingHref = `/organizer/bookings/${encodeURIComponent(booking.id)}`;
  const contact = booking.contactName?.trim() || booking.contactEmail;

  if (booking.status === "new") {
    items.push({
      itemKey: `booking:new:${booking.id}`,
      type: "new_booking",
      category: "bookings",
      title: "Новая заявка",
      body: `${booking.tourTitle} · ${contact}`,
      href: bookingHref,
      createdAt: booking.createdAt,
    });
  }

  for (const change of booking.statusHistory ?? []) {
    if (change.changedBy === "organizer") continue;
    const changedAt = new Date(change.changedAt).getTime();
    if (Number.isNaN(changedAt) || now - changedAt > RECENT_MS) continue;

    const statusLabel = BOOKING_STATUS_LABELS[change.to] ?? change.to;
    items.push({
      itemKey: `booking:status:${booking.id}:${change.changedAt}`,
      type: "booking_status_change",
      category: "bookings",
      title: "Изменение статуса заявки",
      body: `${booking.tourTitle} · ${statusLabel}`,
      href: bookingHref,
      createdAt: change.changedAt,
    });
  }

  const paymentStatus = booking.paymentStatus ?? "pending";
  if (paymentStatus === "pending" || paymentStatus === "partial") {
    items.push({
      itemKey: `payment:attention:${booking.id}`,
      type: "payment_update",
      category: "payments",
      title:
        paymentStatus === "partial"
          ? "Требуется доплата по заявке"
          : "Ожидается оплата заявки",
      body: `${booking.tourTitle} · ${paymentStatusLabel(paymentStatus)}`,
      href: bookingHref,
      createdAt: booking.updatedAt,
    });
  } else if (
    (paymentStatus === "paid" || paymentStatus === "refunded") &&
    booking.updatedAt !== booking.createdAt
  ) {
    const updatedAt = new Date(booking.updatedAt).getTime();
    const createdAt = new Date(booking.createdAt).getTime();
    if (!Number.isNaN(updatedAt) && !Number.isNaN(createdAt) && updatedAt - createdAt > 60_000) {
      items.push({
        itemKey: `payment:update:${booking.id}:${booking.updatedAt}`,
        type: "payment_update",
        category: "payments",
        title: "Обновление оплаты",
        body: `${booking.tourTitle} · ${paymentStatusLabel(paymentStatus)}`,
        href: bookingHref,
        createdAt: booking.updatedAt,
      });
    }
  }

  return items;
}

function buildReviewItems(review: TouristReview, now: number): DraftItem[] {
  const items: DraftItem[] = [];
  const reviewHref = `/organizer/reviews?review=${encodeURIComponent(review.id)}`;
  const createdAt = new Date(review.createdAt).getTime();
  const isRecent = !Number.isNaN(createdAt) && now - createdAt <= NEW_REVIEW_MS;

  if (!review.organizerReply?.trim()) {
    if (isRecent) {
      items.push({
        itemKey: `review:new:${review.id}`,
        type: "new_review",
        category: "reviews",
        title: "Новый отзыв",
        body: `${review.tourTitle} · оценка ${review.rating}`,
        href: reviewHref,
        createdAt: review.createdAt,
      });
    } else {
      items.push({
        itemKey: `review:reply:${review.id}`,
        type: "review_reply_needed",
        category: "reviews",
        title: "Нужен ответ на отзыв",
        body: `${review.tourTitle} · оценка ${review.rating}`,
        href: reviewHref,
        createdAt: review.updatedAt,
      });
    }
  }

  return items;
}

function buildModerationItems(
  row: Database["public"]["Tables"]["moderation_queue"]["Row"]
): DraftItem[] {
  if (row.entity_type !== "tour") return [];

  const title =
    metadataString(row.metadata, "title") ??
    metadataString(row.metadata, "tourTitle") ??
    row.entity_id;
  const slug = metadataString(row.metadata, "slug");
  const tourHref = slug
    ? `/organizer/tours/${encodeURIComponent(row.entity_id)}/edit`
    : `/organizer/tours`;

  if (row.status === "pending" || row.status === "in_review") {
    return [
      {
        itemKey: `moderation:pending:${row.entity_id}`,
        type: "tour_moderation",
        category: "moderation",
        title: "Тур на модерации",
        body: `${title} · ожидает проверки`,
        href: tourHref,
        createdAt: row.created_at,
      },
    ];
  }

  if ((row.status === "approved" || row.status === "rejected") && row.resolved_at) {
    const approved = row.status === "approved";
    return [
      {
        itemKey: `moderation:resolved:${row.entity_id}:${row.resolved_at}`,
        type: "tour_moderation",
        category: "moderation",
        title: approved ? "Тур одобрен модератором" : "Тур отклонён модератором",
        body: approved
          ? `${title} · можно публиковать`
          : `${title} · ${row.reason ?? "требуются правки"}`,
        href: tourHref,
        createdAt: row.resolved_at,
      },
    ];
  }

  return [];
}

function metadataString(metadata: Database["public"]["Tables"]["moderation_queue"]["Row"]["metadata"], key: string): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function applyReadState(items: DraftItem[], readMap: Map<string, string>): OrganizerInboxItem[] {
  return items.map((item) => ({
    ...item,
    readAt: readMap.get(item.itemKey) ?? null,
  }));
}

function filterItems(items: OrganizerInboxItem[], filter: OrganizerInboxFilter): OrganizerInboxItem[] {
  switch (filter) {
    case "unread":
      return items.filter((item) => !item.readAt);
    case "bookings":
      return items.filter((item) => item.category === "bookings");
    case "reviews":
      return items.filter((item) => item.category === "reviews");
    case "payments":
      return items.filter((item) => item.category === "payments");
    default:
      return items;
  }
}

export async function fetchOrganizerInbox(
  supabase: DbClient,
  organizerUserId: string,
  tourSlugs: string[],
  options?: { filter?: OrganizerInboxFilter; limit?: number }
): Promise<{ items: OrganizerInboxItem[]; unreadCount: number }> {
  const filter = options?.filter ?? "all";
  const limit = options?.limit ?? 50;
  const now = Date.now();

  const [readMap, bookings, reviews, moderationRows] = await Promise.all([
    fetchReadMap(supabase, organizerUserId),
    import("@/lib/bookings-server").then(({ fetchOrganizerBookings }) =>
      fetchOrganizerBookings(supabase, organizerUserId, tourSlugs)
    ),
    fetchOrganizerPublishedReviews(supabase, organizerUserId, tourSlugs),
    fetchOrganizerModerationQueue(supabase),
  ]);

  const draftItems: DraftItem[] = [];

  for (const booking of bookings) {
    draftItems.push(...buildBookingItems(booking, now));
  }

  for (const review of reviews) {
    draftItems.push(...buildReviewItems(review, now));
  }

  for (const row of moderationRows) {
    draftItems.push(...buildModerationItems(row));
  }

  const deduped = new Map<string, DraftItem>();
  for (const item of draftItems) {
    const existing = deduped.get(item.itemKey);
    if (!existing || existing.createdAt < item.createdAt) {
      deduped.set(item.itemKey, item);
    }
  }

  const allItems = applyReadState(
    Array.from(deduped.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    readMap
  );

  const unreadCount = allItems.filter((item) => !item.readAt).length;
  const items = filterItems(allItems, filter).slice(0, limit);

  return { items, unreadCount };
}

async function fetchOrganizerModerationQueue(
  supabase: DbClient
): Promise<Database["public"]["Tables"]["moderation_queue"]["Row"][]> {
  const since = new Date(Date.now() - RECENT_MS).toISOString();

  const { data: pending } = await supabase
    .from("moderation_queue")
    .select("*")
    .eq("entity_type", "tour")
    .in("status", ["pending", "in_review"])
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: resolved } = await supabase
    .from("moderation_queue")
    .select("*")
    .eq("entity_type", "tour")
    .in("status", ["approved", "rejected"])
    .gte("resolved_at", since)
    .order("resolved_at", { ascending: false })
    .limit(30);

  const byId = new Map<string, Database["public"]["Tables"]["moderation_queue"]["Row"]>();
  for (const row of [...(pending ?? []), ...(resolved ?? [])]) {
    byId.set(row.id, row);
  }
  return Array.from(byId.values());
}

export async function markOrganizerInboxRead(
  supabase: DbClient,
  organizerUserId: string,
  itemKey: string
): Promise<boolean> {
  const now = new Date().toISOString();
  const { error } = await supabase.from("organizer_inbox_reads").upsert(
    {
      user_id: organizerUserId,
      item_key: itemKey,
      read_at: now,
    },
    { onConflict: "user_id,item_key" }
  );
  return !error;
}

export async function markOrganizerInboxReadMany(
  supabase: DbClient,
  organizerUserId: string,
  itemKeys: string[]
): Promise<number> {
  if (itemKeys.length === 0) return 0;
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("organizer_inbox_reads")
    .upsert(
      itemKeys.map((itemKey) => ({
        user_id: organizerUserId,
        item_key: itemKey,
        read_at: now,
      })),
      { onConflict: "user_id,item_key" }
    )
    .select("item_key");

  if (error || !data) return 0;
  return data.length;
}

export async function countOrganizerInboxUnread(
  supabase: DbClient,
  organizerUserId: string,
  tourSlugs: string[]
): Promise<number> {
  const { unreadCount } = await fetchOrganizerInbox(supabase, organizerUserId, tourSlugs, {
    filter: "all",
    limit: 500,
  });
  return unreadCount;
}
