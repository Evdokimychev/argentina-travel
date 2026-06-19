import type { AppNotification } from "@/lib/notifications/types";
import {
  NOTIFICATIONS_STORE_KEY,
  NOTIFICATIONS_UPDATED_EVENT,
} from "@/lib/notifications/types";

function createId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `ntf-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `ntf-${Date.now().toString(36)}`;
}

function readAll(): AppNotification[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(NOTIFICATIONS_STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AppNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(notifications: AppNotification[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NOTIFICATIONS_STORE_KEY, JSON.stringify(notifications));
}

function notifyUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT));
  }
}

export function addNotification(
  input: Omit<AppNotification, "id" | "read" | "createdAt"> & {
    id?: string;
    read?: boolean;
    createdAt?: string;
  }
): AppNotification {
  const notification: AppNotification = {
    id: input.id ?? createId(),
    userId: input.userId,
    contactEmail: input.contactEmail?.trim().toLowerCase() || undefined,
    category: input.category,
    title: input.title,
    body: input.body,
    href: input.href,
    bookingId: input.bookingId,
    read: input.read ?? false,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };

  const all = readAll();
  writeAll([notification, ...all]);
  notifyUpdated();

  if (process.env.NODE_ENV !== "production") {
    console.info("[notification]", notification.title, notification.body);
  }

  return notification;
}

export function getNotificationsForUser(input: {
  userId: string;
  contactEmail?: string;
  limit?: number;
}): AppNotification[] {
  const email = input.contactEmail?.trim().toLowerCase();
  const list = readAll().filter(
    (item) =>
      item.userId === input.userId ||
      (email && item.contactEmail?.toLowerCase() === email)
  );

  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return input.limit ? list.slice(0, input.limit) : list;
}

export function getUnreadNotificationsCount(input: {
  userId: string;
  contactEmail?: string;
}): number {
  return getNotificationsForUser(input).filter((item) => !item.read).length;
}

export function markNotificationRead(notificationId: string): void {
  const all = readAll();
  const index = all.findIndex((item) => item.id === notificationId);
  if (index === -1) return;

  all[index] = { ...all[index], read: true };
  writeAll(all);
  notifyUpdated();
}

export function markAllNotificationsRead(input: {
  userId: string;
  contactEmail?: string;
}): void {
  const email = input.contactEmail?.trim().toLowerCase();
  const all = readAll().map((item) => {
    const matches =
      item.userId === input.userId ||
      (email && item.contactEmail?.toLowerCase() === email);
    return matches ? { ...item, read: true } : item;
  });
  writeAll(all);
  notifyUpdated();
}
