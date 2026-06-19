export type NotificationChannel = "in_app" | "email";

export type NotificationCategory =
  | "booking"
  | "payment"
  | "travelers"
  | "reviews"
  | "moderation"
  | "system";

export type NotificationScope = "tourist" | "organizer";

export type UnifiedNotificationSource = "system" | "inbox";

export type UnifiedNotificationItem = {
  id: string;
  source: UnifiedNotificationSource;
  category: NotificationCategory;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
  itemKey?: string;
};

export type NotificationPreferenceItem = {
  channel: NotificationChannel;
  category: NotificationCategory;
  enabled: boolean;
};

export type NotificationsListResponse = {
  items: UnifiedNotificationItem[];
  unreadCount: number;
  preferences: NotificationPreferenceItem[];
};

export const NOTIFICATIONS_HUB_UPDATED_EVENT = "notifications-hub-updated";

export const TOURIST_NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  "booking",
  "payment",
  "travelers",
  "reviews",
  "system",
];

export const ORGANIZER_NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  "booking",
  "payment",
  "reviews",
  "moderation",
  "system",
];

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  booking: "Заявки и бронирования",
  payment: "Оплата",
  travelers: "Данные участников",
  reviews: "Отзывы",
  moderation: "Модерация туров",
  system: "Системные сообщения",
};

export const NOTIFICATION_CHANNEL_LABELS: Record<NotificationChannel, string> = {
  in_app: "В приложении",
  email: "Email",
};

export function inboxCategoryToNotificationCategory(
  category: string
): NotificationCategory {
  switch (category) {
    case "bookings":
      return "booking";
    case "payments":
      return "payment";
    case "reviews":
      return "reviews";
    case "moderation":
      return "moderation";
    default:
      return "system";
  }
}

export function unifiedInboxId(itemKey: string): string {
  return `inbox:${itemKey}`;
}

export function parseUnifiedInboxId(id: string): string | null {
  if (!id.startsWith("inbox:")) return null;
  return id.slice("inbox:".length);
}
