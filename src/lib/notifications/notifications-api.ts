import type {
  NotificationPreferenceItem,
  NotificationScope,
  NotificationsListResponse,
} from "@/types/notifications-hub";
import { NOTIFICATIONS_HUB_UPDATED_EVENT } from "@/types/notifications-hub";

function notifyHubUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_HUB_UPDATED_EVENT));
  }
}

export async function apiFetchNotifications(
  scope: NotificationScope,
  limit = 20
): Promise<NotificationsListResponse> {
  const params = new URLSearchParams({ scope, limit: String(limit) });
  const res = await fetch(`/api/notifications?${params.toString()}`, {
    credentials: "same-origin",
  });

  if (!res.ok) {
    throw new Error("Не удалось загрузить уведомления");
  }

  return (await res.json()) as NotificationsListResponse;
}

export async function apiMarkNotificationRead(input: {
  id?: string;
  itemKey?: string;
  markAll?: boolean;
  scope?: NotificationScope;
}): Promise<void> {
  const res = await fetch("/api/notifications", {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error("Не удалось отметить уведомление");
  }

  notifyHubUpdated();
}

export async function apiUpdateNotificationPreferences(input: {
  scope: NotificationScope;
  preferences: NotificationPreferenceItem[];
}): Promise<NotificationPreferenceItem[]> {
  const res = await fetch("/api/notifications/preferences", {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error("Не удалось сохранить настройки уведомлений");
  }

  const body = (await res.json()) as { preferences?: NotificationPreferenceItem[] };
  notifyHubUpdated();
  return body.preferences ?? input.preferences;
}

export { NOTIFICATIONS_HUB_UPDATED_EVENT, notifyHubUpdated };
