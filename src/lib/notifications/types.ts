export type NotificationCategory = "booking" | "payment" | "travelers" | "system";

export interface AppNotification {
  id: string;
  /** Tourist user id or guest id (`guest-…`). */
  userId: string;
  /** Used to surface notifications before account attach. */
  contactEmail?: string;
  category: NotificationCategory;
  title: string;
  body: string;
  href?: string;
  bookingId?: string;
  read: boolean;
  createdAt: string;
}

export const NOTIFICATIONS_STORE_KEY = "argentina-travel-notifications";
export const NOTIFICATIONS_UPDATED_EVENT = "app-notifications-updated";
