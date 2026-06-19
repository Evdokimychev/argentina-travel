export {
  NOTIFICATIONS_STORE_KEY,
  NOTIFICATIONS_UPDATED_EVENT,
  type AppNotification,
  type NotificationCategory,
} from "@/lib/notifications/types";

export {
  addNotification,
  getNotificationsForUser,
  getUnreadNotificationsCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/store";

export {
  notifyBookingCreated,
  notifyPaymentReminder,
  notifyPaymentStatusChanged,
  notifyPayLaterAcknowledged,
  notifyTravelersFormDue,
} from "@/lib/notifications/booking-notifications";

export {
  apiFetchNotifications,
  apiMarkNotificationRead,
  apiUpdateNotificationPreferences,
  NOTIFICATIONS_HUB_UPDATED_EVENT,
  notifyHubUpdated,
} from "@/lib/notifications/notifications-api";
