export type ProfileNavId = "dashboard" | "favorites" | "bookings" | "reviews" | "settings";

export interface ProfileNavItem {
  id: ProfileNavId;
  label: string;
  href: string;
}

export const PROFILE_NAV_ITEMS: ProfileNavItem[] = [
  { id: "dashboard", label: "Обзор", href: "/profile" },
  { id: "favorites", label: "Избранное", href: "/profile/favorites" },
  { id: "bookings", label: "Бронирования", href: "/profile/bookings" },
  { id: "reviews", label: "Отзывы", href: "/profile/reviews" },
  { id: "settings", label: "Настройки", href: "/profile/settings" },
];

export { BOOKING_STATUS_LABELS } from "@/data/booking-statuses";

export const REVIEW_STATUS_LABELS: Record<
  import("@/types/tourist").TouristReviewStatus,
  string
> = {
  draft: "Черновик",
  published: "Опубликован",
};
