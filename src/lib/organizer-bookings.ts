import { getCatalogSlug } from "@/lib/tour-slug";
import { getOrganizerTourListingsForUser } from "@/lib/organizer-tour-store";
import { getOrganizerBookings, getOrganizerBookingStats } from "@/lib/bookings-store";
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

  return ORGANIZER_NAV_ITEMS.map((item) => {
    if (item.id === "bookings" && stats.activeInboxCount > 0) {
      return { ...item, badge: stats.activeInboxCount };
    }
    return item;
  });
}
