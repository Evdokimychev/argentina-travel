import { getCatalogSlug } from "@/lib/tour-slug";
import { getOrganizerTourListingsForUser } from "@/lib/organizer-tour-store";
import { getOrganizerBookings, getOrganizerBookingStats } from "@/lib/bookings-store";
import { getUnreadMessagesCount } from "@/lib/messages-store";
import { ORGANIZER_NAV_ITEMS, type OrganizerNavItem } from "@/data/organizer-dashboard";
import type { Booking } from "@/types/tourist";

export function getOrganizerCatalogSlugs(userId: string): string[] {
  return getOrganizerTourListingsForUser(userId).map((listing) => getCatalogSlug(listing));
}

export function getOrganizerBookingsForCabinet(userId: string): Booking[] {
  return getOrganizerBookings(getOrganizerCatalogSlugs(userId));
}

export function getOrganizerCabinetBookingStats(userId: string) {
  return getOrganizerBookingStats(getOrganizerCatalogSlugs(userId));
}

export function getOrganizerNavItemsWithBadges(userId: string): OrganizerNavItem[] {
  const stats = getOrganizerCabinetBookingStats(userId);
  const unreadMessages = getUnreadMessagesCount({ userId, role: "organizer" });

  return ORGANIZER_NAV_ITEMS.map((item) => {
    if (item.id === "bookings" && stats.activeInboxCount > 0) {
      return { ...item, badge: stats.activeInboxCount };
    }
    if (item.id === "messages" && unreadMessages > 0) {
      return { ...item, badge: unreadMessages };
    }
    return item;
  });
}
