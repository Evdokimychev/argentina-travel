export type ProfileNavId =
  | "dashboard"
  | "favorites"
  | "bookings"
  | "orders"
  | "messages"
  | "reviews"
  | "settings";

export interface ProfileNavItem {
  id: ProfileNavId;
  label: string;
  href: string;
  badge?: number;
}

/** Основная навигация; «Настройки» — в шапке сайдбара (как у организатора). */
export const PROFILE_NAV_ITEMS: ProfileNavItem[] = [
  { id: "dashboard", label: "Обзор", href: "/profile" },
  { id: "favorites", label: "Избранное", href: "/profile/favorites" },
  { id: "bookings", label: "Бронирования", href: "/profile/bookings" },
  { id: "orders", label: "Заказы", href: "/profile/orders" },
  { id: "messages", label: "Сообщения", href: "/profile/messages" },
  { id: "reviews", label: "Отзывы", href: "/profile/reviews" },
];

export const PROFILE_SETTINGS_HREF = "/profile/settings";

export { BOOKING_STATUS_LABELS } from "@/data/booking-statuses";

export const REVIEW_STATUS_LABELS: Record<
  import("@/types/tourist").TouristReviewStatus,
  string
> = {
  draft: "Черновик",
  published: "Опубликован",
};
