import { PROFILE_NAV_ITEMS, type ProfileNavItem } from "@/data/tourist-dashboard";
import { getPendingBookingsCount } from "@/lib/bookings-store";
import { getUnreadMessagesCount } from "@/lib/messages-store";

export function getProfileNavItemsWithBadges(
  userId: string,
  options?: { unreadMessages?: number }
): ProfileNavItem[] {
  const pendingBookings = getPendingBookingsCount(userId);
  const unreadMessages =
    options?.unreadMessages ?? getUnreadMessagesCount({ userId, role: "tourist" });

  return PROFILE_NAV_ITEMS.map((item) => {
    if (item.id === "bookings" && pendingBookings > 0) {
      return { ...item, badge: pendingBookings };
    }
    if (item.id === "messages" && unreadMessages > 0) {
      return { ...item, badge: unreadMessages };
    }
    return item;
  });
}
