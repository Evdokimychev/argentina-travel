import { getCatalogSlug } from "@/lib/tour-slug";
import { getOrganizerTourListings } from "@/lib/organizer-tour-store";
import { getOrganizerBookings, getOrganizerBookingStats } from "@/lib/bookings-store";
import { ORGANIZER_NAV_ITEMS, type OrganizerNavItem } from "@/data/organizer-dashboard";
import type { Booking } from "@/types/tourist";

export function getOrganizerCatalogSlugs(): string[] {
  return getOrganizerTourListings().map((listing) => getCatalogSlug(listing));
}

export function getOrganizerBookingsForCabinet(): Booking[] {
  return getOrganizerBookings(getOrganizerCatalogSlugs());
}

export function getOrganizerCabinetBookingStats() {
  return getOrganizerBookingStats(getOrganizerCatalogSlugs());
}

export function getOrganizerNavItemsWithBadges(): OrganizerNavItem[] {
  const stats = getOrganizerCabinetBookingStats();

  return ORGANIZER_NAV_ITEMS.map((item) => {
    if (item.id === "bookings" && stats.activeInboxCount > 0) {
      return { ...item, badge: stats.activeInboxCount };
    }
    return item;
  });
}
