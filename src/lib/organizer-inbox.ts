import { BOOKING_PAYMENT_STATUS_LABELS } from "@/lib/booking-params";
import { BOOKING_STATUS_LABELS } from "@/data/booking-statuses";
import { getOrganizerBookingsForCabinet } from "@/lib/organizer-bookings";
import { getOrganizerReviewsForCabinet } from "@/lib/organizer-reviews";
import type { BookingPaymentStatus } from "@/types/booking-params";
import type { Booking, TouristReview } from "@/types/tourist";
import type {
  OrganizerInboxFilter,
  OrganizerInboxItem,
} from "@/types/organizer-inbox";
import { ORGANIZER_INBOX_UPDATED_EVENT } from "@/types/organizer-inbox";

export { ORGANIZER_INBOX_UPDATED_EVENT };

const READS_STORE_KEY = "organizer-inbox-reads";
const RECENT_MS = 30 * 24 * 60 * 60 * 1000;
const NEW_REVIEW_MS = 14 * 24 * 60 * 60 * 1000;

type DraftItem = Omit<OrganizerInboxItem, "readAt">;

function readLocalReadMap(userId: string): Map<string, string> {
  if (typeof window === "undefined") return new Map();

  try {
    const raw = window.localStorage.getItem(READS_STORE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as Record<string, Record<string, string>>;
    const userReads = parsed[userId] ?? {};
    return new Map(Object.entries(userReads));
  } catch {
    return new Map();
  }
}

function writeLocalRead(userId: string, itemKey: string) {
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(READS_STORE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, Record<string, string>>) : {};
    const userReads = parsed[userId] ?? {};
    userReads[itemKey] = new Date().toISOString();
    parsed[userId] = userReads;
    window.localStorage.setItem(READS_STORE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

function notifyInboxUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ORGANIZER_INBOX_UPDATED_EVENT));
  }
}

function paymentStatusLabel(status: string | null | undefined): string {
  if (!status) return BOOKING_PAYMENT_STATUS_LABELS.pending;
  return BOOKING_PAYMENT_STATUS_LABELS[status as BookingPaymentStatus] ?? status;
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

    items.push({
      itemKey: `booking:status:${booking.id}:${change.changedAt}`,
      type: "booking_status_change",
      category: "bookings",
      title: "Изменение статуса заявки",
      body: `${booking.tourTitle} · ${BOOKING_STATUS_LABELS[change.to] ?? change.to}`,
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
  }

  return items;
}

function buildReviewItems(review: TouristReview, now: number): DraftItem[] {
  if (review.organizerReply?.trim()) return [];

  const reviewHref = `/organizer/reviews?review=${encodeURIComponent(review.id)}`;
  const createdAt = new Date(review.createdAt).getTime();
  const isRecent = !Number.isNaN(createdAt) && now - createdAt <= NEW_REVIEW_MS;

  if (isRecent) {
    return [
      {
        itemKey: `review:new:${review.id}`,
        type: "new_review",
        category: "reviews",
        title: "Новый отзыв",
        body: `${review.tourTitle} · оценка ${review.rating}`,
        href: reviewHref,
        createdAt: review.createdAt,
      },
    ];
  }

  return [
    {
      itemKey: `review:reply:${review.id}`,
      type: "review_reply_needed",
      category: "reviews",
      title: "Нужен ответ на отзыв",
      body: `${review.tourTitle} · оценка ${review.rating}`,
      href: reviewHref,
      createdAt: review.updatedAt,
    },
  ];
}

function buildLocalInboxDrafts(userId: string, now: number): DraftItem[] {
  const items: DraftItem[] = [];

  for (const booking of getOrganizerBookingsForCabinet(userId)) {
    items.push(...buildBookingItems(booking, now));
  }

  for (const review of getOrganizerReviewsForCabinet(userId)) {
    items.push(...buildReviewItems(review, now));
  }

  return items;
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

export function getLocalOrganizerInbox(
  userId: string,
  filter: OrganizerInboxFilter = "all",
  limit = 50
): { items: OrganizerInboxItem[]; unreadCount: number } {
  const now = Date.now();
  const readMap = readLocalReadMap(userId);
  const deduped = new Map<string, DraftItem>();

  for (const item of buildLocalInboxDrafts(userId, now)) {
    deduped.set(item.itemKey, item);
  }

  const allItems = Array.from(deduped.values())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((item) => ({
      ...item,
      readAt: readMap.get(item.itemKey) ?? null,
    }));

  const unreadCount = allItems.filter((item) => !item.readAt).length;
  return {
    items: filterItems(allItems, filter).slice(0, limit),
    unreadCount,
  };
}

export function markLocalOrganizerInboxRead(userId: string, itemKey: string) {
  writeLocalRead(userId, itemKey);
  notifyInboxUpdated();
}

export function getLocalOrganizerInboxUnreadCount(userId: string): number {
  return getLocalOrganizerInbox(userId, "all", 500).unreadCount;
}

export async function apiFetchOrganizerInbox(
  filter: OrganizerInboxFilter = "all"
): Promise<{ items: OrganizerInboxItem[]; unreadCount: number }> {
  const response = await fetch(`/api/organizer/inbox?filter=${encodeURIComponent(filter)}`);
  const body = (await response.json()) as {
    items?: OrganizerInboxItem[];
    unreadCount?: number;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }
  return {
    items: body.items ?? [],
    unreadCount: body.unreadCount ?? 0,
  };
}

export async function apiMarkOrganizerInboxRead(itemKey: string): Promise<void> {
  const response = await fetch("/api/organizer/inbox", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemKey }),
  });
  if (!response.ok) {
    const body = (await response.json()) as { error?: string };
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }
}

export async function apiMarkAllOrganizerInboxRead(itemKeys: string[]): Promise<void> {
  const response = await fetch("/api/organizer/inbox", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemKeys }),
  });
  if (!response.ok) {
    const body = (await response.json()) as { error?: string };
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }
}
