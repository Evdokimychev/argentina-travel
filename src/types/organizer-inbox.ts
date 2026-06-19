export type OrganizerInboxItemType =
  | "new_booking"
  | "booking_status_change"
  | "new_review"
  | "review_reply_needed"
  | "payment_update"
  | "tour_moderation";

export type OrganizerInboxCategory = "bookings" | "reviews" | "payments" | "moderation";

export type OrganizerInboxFilter = "all" | "unread" | "bookings" | "reviews" | "payments";

export type OrganizerInboxItem = {
  itemKey: string;
  type: OrganizerInboxItemType;
  category: OrganizerInboxCategory;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  readAt: string | null;
};

export const ORGANIZER_INBOX_UPDATED_EVENT = "organizer-inbox-updated";
